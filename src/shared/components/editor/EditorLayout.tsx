import { useEffect, useRef, useState } from 'react'
import { fetchToolResult, getToolById, startToolJob } from '../../../features/pdf-tools'
import type { ToolId } from '../../../features/pdf-tools/shared/types'
import { assertFilesAllowed, getPlanLimits, getStoredPlan, incrementLocalUsage } from '../../plan'
import { EditorTopBar } from './EditorTopBar.tsx'
import { EditorSidebar } from './EditorSidebar.tsx'
import { EditorCanvas } from './EditorCanvas.tsx'
import { EditorToolbar } from './EditorToolbar.tsx'

type ToolbarTool = 'select' | 'text' | 'textbox' | 'draw' | 'image' | 'undo' | 'crop' | 'split' | 'page' | 'link' | 'signature'

type EditorLayoutProps = {
  initialToolId?: ToolId | null
}

let retainedFile: File | null = null
let retainedFiles: File[] = []
let retainedZoom = 100
let retainedDownloadUrl: string | null = null
let retainedDownloadName = 'document'

function clearDownloadState(
  setDownloadUrl: (value: string | null) => void,
  setDownloadName: (value: string) => void,
) {
  if (retainedDownloadUrl) URL.revokeObjectURL(retainedDownloadUrl)
  retainedDownloadUrl = null
  retainedDownloadName = 'document'
  setDownloadUrl(null)
  setDownloadName('document')
}

export function EditorLayout({ initialToolId = null }: EditorLayoutProps) {
  const [file, setFile] = useState<File | null>(retainedFile)
  const [files, setFiles] = useState<File[]>(retainedFiles.length ? retainedFiles : retainedFile ? [retainedFile] : [])
  const [zoom, setZoom] = useState(retainedZoom)
  const [activeSidebarTool, setActiveSidebarTool] = useState<ToolId | null>(initialToolId)
  const [activeToolbarTool, setActiveToolbarTool] = useState<ToolbarTool>('select')
  const [downloadUrl, setDownloadUrl] = useState<string | null>(retainedDownloadUrl)
  const [downloadName, setDownloadName] = useState(retainedDownloadName)
  const [resultFile, setResultFile] = useState<File | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [operationOptions, setOperationOptions] = useState<Record<string, unknown>>({})
  const [runRequest, setRunRequest] = useState(0)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [planLabel, setPlanLabel] = useState(() => getPlanLimits(getStoredPlan()).label)
  const [isPro, setIsPro] = useState(() => getPlanLimits(getStoredPlan()).isPro)

  useEffect(() => {
    const limits = getPlanLimits(getStoredPlan())
    setPlanLabel(limits.label)
    setIsPro(limits.isPro)
  }, [])

  const jobContextRef = useRef({
    file,
    files,
    toolId: (activeSidebarTool ?? initialToolId) as ToolId | null,
    operationOptions,
  })
  jobContextRef.current = {
    file,
    files,
    toolId: activeSidebarTool ?? initialToolId,
    operationOptions,
  }

  useEffect(() => {
    setActiveSidebarTool((current) => current ?? initialToolId)
  }, [initialToolId])

  useEffect(() => {
    return () => {
      if (downloadUrl && downloadUrl !== retainedDownloadUrl) URL.revokeObjectURL(downloadUrl)
    }
  }, [downloadUrl])

  useEffect(() => {
    if (retainedFile && !file) setFile(retainedFile)
  }, [file])

  useEffect(() => {
    if (!successMessage) return
    const timer = window.setTimeout(() => setSuccessMessage(null), 5200)
    return () => window.clearTimeout(timer)
  }, [successMessage])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 4200)
    return () => window.clearTimeout(timer)
  }, [notice])

  // Jobs run only when the user explicitly clicks Run (runRequest increments).
  useEffect(() => {
    if (runRequest === 0) return

    const { file: selectedFile, files: selectedFiles, toolId, operationOptions: options } = jobContextRef.current
    if (!selectedFile || !toolId) return

    const activeFile = selectedFile
    const activeToolId = toolId
    let cancelled = false

    async function processFile() {
      setErrorMessage(null)
      setSuccessMessage(null)
      setIsProcessing(true)

      try {
        const result = await startToolJob(activeToolId, selectedFiles, options)
        const blob = await fetchToolResult(result.jobId)
        if (cancelled) return

        const nextUrl = URL.createObjectURL(blob)
        const resultName = result.filename || activeFile.name
        const generatedFile = new File([blob], resultName, {
          type: blob.type || 'application/octet-stream',
        })
        if (retainedDownloadUrl) URL.revokeObjectURL(retainedDownloadUrl)
        retainedDownloadUrl = nextUrl
        retainedDownloadName = resultName
        setDownloadUrl(nextUrl)
        setDownloadName(retainedDownloadName)

        // Keep the visual canvas on previewable outputs only (PDF/Office/images).
        // Zip/text results stay downloadable without replacing the good upload preview.
        const lower = resultName.toLowerCase()
        const previewable = (
          lower.endsWith('.pdf')
          || lower.endsWith('.doc')
          || lower.endsWith('.docx')
          || lower.endsWith('.xls')
          || lower.endsWith('.xlsx')
          || lower.endsWith('.ppt')
          || lower.endsWith('.pptx')
          || lower.endsWith('.png')
          || lower.endsWith('.jpg')
          || lower.endsWith('.jpeg')
          || lower.endsWith('.webp')
          || generatedFile.type.startsWith('image/')
          || generatedFile.type === 'application/pdf'
        )
        setResultFile(previewable ? generatedFile : null)

        const toolName = getToolById(activeToolId)?.name ?? 'Operation'
        incrementLocalUsage()
        setSuccessMessage(
          previewable
            ? `${toolName} completed successfully. Your file is ready to download.`
            : `${toolName} completed successfully. Download the result from the top bar.`
        )
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'The selected tool could not process this file.'
          setErrorMessage(message)
          setSuccessMessage(null)
          clearDownloadState(setDownloadUrl, setDownloadName)
          setResultFile(null)
        }
      } finally {
        if (!cancelled) setIsProcessing(false)
      }
    }

    processFile()

    return () => {
      cancelled = true
    }
  }, [runRequest])

  const handleSelectTool = (toolId: ToolId) => {
    setActiveSidebarTool(toolId)
    setRunRequest(0)
    setResultFile(null)
    setSuccessMessage(null)
    setErrorMessage(null)
    setOperationOptions({})
    clearDownloadState(setDownloadUrl, setDownloadName)
  }

  const handleUpload = (uploadedFiles: File | File[]) => {
    const toolId = activeSidebarTool ?? initialToolId
    const nextFiles = Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles]
    const selectedFiles = toolId === 'merge' && files.length > 0
      ? [...files, ...nextFiles]
      : nextFiles
    const nextFile = selectedFiles[0]
    if (!nextFile) return

    const gate = assertFilesAllowed(selectedFiles, String(toolId || 'pdf-to-word'), getStoredPlan())
    if (!gate.ok) {
      setErrorMessage(gate.message)
      return
    }

    retainedFile = nextFile
    retainedFiles = selectedFiles
    setFile(nextFile)
    setFiles(selectedFiles)
    setOperationOptions({})
    setRunRequest(0)
    setResultFile(null)
    setSuccessMessage(null)
    setErrorMessage(null)
    clearDownloadState(setDownloadUrl, setDownloadName)
  }

  const fileName = file?.name ?? 'Your Document.pdf'
  const handleZoomChange = (nextZoom: number) => {
    retainedZoom = nextZoom
    setZoom(nextZoom)
  }
  const handleRunOperation = () => {
    if (!file) {
      setErrorMessage('Upload a file before running a tool.')
      return
    }
    if (!(activeSidebarTool ?? initialToolId)) {
      setErrorMessage('Choose a tool from the sidebar, review the file, then click Run.')
      return
    }
    const toolId = String(activeSidebarTool ?? initialToolId)
    const gate = assertFilesAllowed(files.length ? files : [file], toolId, getStoredPlan())
    if (!gate.ok) {
      setErrorMessage(gate.message)
      return
    }
    setRunRequest((current) => current + 1)
  }
  const handleRename = () => {
    const nextName = window.prompt('Rename document', displayName ?? file?.name ?? 'document')
    if (nextName?.trim()) setDisplayName(nextName.trim())
  }
  const handleQuickAction = (action: 'tools' | 'pages' | 'bookmarks' | 'search') => {
    if (action === 'pages') document.querySelector('.pdf-pages')?.scrollIntoView({ behavior: 'smooth' })
    else if (action === 'search') {
      const query = window.prompt('Search document')
      const browserWindow = window as Window & { find?: (text: string) => boolean }
      if (query?.trim()) browserWindow.find?.(query.trim())
    }
    else setNotice(action === 'bookmarks' ? 'Bookmarks are ready for the current document.' : null)
  }

  const selectedToolId = activeSidebarTool ?? initialToolId

  return (
    <div className="editor-app">
      <EditorTopBar
        fileName={displayName ?? fileName}
        zoom={zoom}
        onZoomChange={handleZoomChange}
        onRename={handleRename}
        onHistory={() => setNotice('History is available for this document during the current session.')}
        onViewMode={() => setNotice('View mode is active.')}
        onMoreOptions={() => setNotice('Use Download to export the current result.')}
        onDownload={downloadUrl ? () => {
          const anchor = document.createElement('a')
          anchor.href = downloadUrl
          anchor.download = downloadName
          anchor.click()
        } : undefined}
        processing={isProcessing}
        planLabel={planLabel}
        isPro={isPro}
      />

      <div className="editor-body">
        <EditorSidebar activeTool={activeSidebarTool} onSelectTool={handleSelectTool} onQuickAction={handleQuickAction} />

        <div className="editor-main">
          <div className="editor-status-stack" aria-live="polite">
            {errorMessage && (
              <div className="editor-status-banner error" role="alert">
                <span className="editor-status-icon" aria-hidden="true">!</span>
                <div className="editor-status-copy">
                  <strong>Something went wrong</strong>
                  <p>{errorMessage}</p>
                </div>
                <button type="button" className="editor-status-dismiss" onClick={() => setErrorMessage(null)} aria-label="Dismiss error">
                  ×
                </button>
              </div>
            )}
            {successMessage && (
              <div className="editor-status-banner success" role="status">
                <span className="editor-status-icon" aria-hidden="true">✓</span>
                <div className="editor-status-copy">
                  <strong>Done</strong>
                  <p>{successMessage}</p>
                </div>
                <button type="button" className="editor-status-dismiss" onClick={() => setSuccessMessage(null)} aria-label="Dismiss success message">
                  ×
                </button>
              </div>
            )}
            {notice && (
              <div className="editor-status-banner notice" role="status">
                <span className="editor-status-icon" aria-hidden="true">i</span>
                <div className="editor-status-copy">
                  <strong>Notice</strong>
                  <p>{notice}</p>
                </div>
                <button type="button" className="editor-status-dismiss" onClick={() => setNotice(null)} aria-label="Dismiss notice">
                  ×
                </button>
              </div>
            )}
          </div>
          <EditorCanvas
            zoom={zoom}
            file={file}
            fileName={file ? file.name : null}
            onUpload={handleUpload}
            onUploadMultiple={handleUpload}
            files={files}
            previewFile={resultFile}
            onOperationOptionsChange={setOperationOptions}
            onRunOperation={handleRunOperation}
            activeSidebarTool={selectedToolId}
            activeToolbarTool={activeToolbarTool}
            isProcessing={isProcessing}
          />
          <EditorToolbar activeTool={activeToolbarTool} onSelectTool={setActiveToolbarTool} />
        </div>
      </div>
    </div>
  )
}
