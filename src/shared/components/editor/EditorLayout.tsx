import { useEffect, useState } from 'react'
import { fetchToolResult, startToolJob } from '../../../features/pdf-tools'
import type { ToolId } from '../../../features/pdf-tools/shared/types'
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

export function EditorLayout({ initialToolId = null }: EditorLayoutProps) {
  const [file, setFile] = useState<File | null>(retainedFile)
  const [files, setFiles] = useState<File[]>(retainedFiles.length ? retainedFiles : retainedFile ? [retainedFile] : [])
  const [zoom, setZoom] = useState(retainedZoom)
  const [activeSidebarTool, setActiveSidebarTool] = useState<ToolId | null>(initialToolId)
  const [activeToolbarTool, setActiveToolbarTool] = useState<ToolbarTool>('select')
  const [downloadUrl, setDownloadUrl] = useState<string | null>(retainedDownloadUrl)
  const [downloadName, setDownloadName] = useState(retainedDownloadName)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [operationOptions, setOperationOptions] = useState<Record<string, unknown>>({})
  const [runRequest, setRunRequest] = useState(0)

  useEffect(() => {
    setActiveSidebarTool((current) => current ?? initialToolId)
  }, [initialToolId])

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        if (downloadUrl !== retainedDownloadUrl) URL.revokeObjectURL(downloadUrl)
      }
    }
  }, [downloadUrl])

  const effectiveToolId = activeSidebarTool ?? initialToolId ?? 'pdf-to-word'

  useEffect(() => {
    if (retainedFile && !file) {
      setFile(retainedFile)
    }
  }, [file])

  useEffect(() => {
    if (!file || runRequest === 0) return

    const selectedFile = file
    let cancelled = false

    async function processFile() {
      setErrorMessage(null)
      setIsProcessing(true)

      try {
        const result = await startToolJob(effectiveToolId, files, operationOptions)
        const blob = await fetchToolResult(result.jobId)
        if (cancelled) return

        const nextUrl = URL.createObjectURL(blob)
        if (retainedDownloadUrl) URL.revokeObjectURL(retainedDownloadUrl)
        retainedDownloadUrl = nextUrl
        retainedDownloadName = result.filename || selectedFile.name
        setDownloadUrl(() => nextUrl)
        setDownloadName(retainedDownloadName)
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'The selected tool could not process this file.'
          setErrorMessage(message)
          setDownloadUrl((previousUrl) => {
            if (previousUrl) URL.revokeObjectURL(previousUrl)
            retainedDownloadUrl = null
            return null
          })
        }
      } finally {
        if (!cancelled) setIsProcessing(false)
      }
    }

    processFile()

    return () => {
      cancelled = true
    }
  }, [file, files, effectiveToolId, operationOptions, runRequest])

  const handleUpload = (uploadedFiles: File | File[]) => {
    const nextFiles = Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles]
    const selectedFiles = effectiveToolId === 'merge' && files.length > 0
      ? [...files, ...nextFiles]
      : nextFiles
    const nextFile = selectedFiles[0]
    if (!nextFile) return
    retainedFile = nextFile
    if (retainedDownloadUrl) URL.revokeObjectURL(retainedDownloadUrl)
    retainedDownloadUrl = null
    retainedDownloadName = 'document'
    setFile(nextFile)
    setFiles(selectedFiles)
    retainedFiles = selectedFiles
    setOperationOptions({})
    setRunRequest(0)
    setDownloadUrl(null)
    setErrorMessage(null)
  }

  const fileName = file?.name ?? 'Your Document.pdf'
  const handleZoomChange = (nextZoom: number) => {
    retainedZoom = nextZoom
    setZoom(nextZoom)
  }
  const handleRunOperation = () => setRunRequest((current) => current + 1)

  return (
    <div className="editor-app">
      <EditorTopBar
        fileName={fileName}
        zoom={zoom}
        onZoomChange={handleZoomChange}
        onDownload={downloadUrl ? () => {
          const anchor = document.createElement('a')
          anchor.href = downloadUrl
          anchor.download = downloadName
          anchor.click()
        } : undefined}
        processing={isProcessing}
      />

      <div className="editor-body">
        <EditorSidebar activeTool={activeSidebarTool} onSelectTool={setActiveSidebarTool} />

        <div className="editor-main">
          {errorMessage && (
            <div className="editor-status-banner" role="alert">
              {errorMessage}
            </div>
          )}
          <EditorCanvas
            zoom={zoom}
            file={file}
            fileName={file ? file.name : null}
            onUpload={handleUpload}
            onUploadMultiple={handleUpload}
            files={files}
            onOperationOptionsChange={setOperationOptions}
            onRunOperation={handleRunOperation}
            activeSidebarTool={activeSidebarTool}
            activeToolbarTool={activeToolbarTool}
          />
          <EditorToolbar activeTool={activeToolbarTool} onSelectTool={setActiveToolbarTool} />
        </div>
      </div>
    </div>
  )
}
