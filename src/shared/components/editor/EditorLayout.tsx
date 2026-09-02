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

export function EditorLayout({ initialToolId = null }: EditorLayoutProps) {
  const [file, setFile] = useState<File | null>(null)
  const [zoom, setZoom] = useState(100)
  const [activeSidebarTool, setActiveSidebarTool] = useState<ToolId | null>(initialToolId)
  const [activeToolbarTool, setActiveToolbarTool] = useState<ToolbarTool>('select')
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [downloadName, setDownloadName] = useState('document')
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    setActiveSidebarTool((current) => current ?? initialToolId)
  }, [initialToolId])

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl)
      }
    }
  }, [downloadUrl])

  const effectiveToolId = activeSidebarTool ?? initialToolId ?? 'pdf-to-word'

  const handleUpload = async (nextFile: File) => {
    setFile(nextFile)
    setErrorMessage(null)
    setIsProcessing(true)

    try {
      const result = await startToolJob(effectiveToolId, nextFile)
      const blob = await fetchToolResult(result.jobId)
      const nextUrl = URL.createObjectURL(blob)

      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl)
      }

      setDownloadUrl(nextUrl)
      setDownloadName(result.filename || nextFile.name)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The selected tool could not process this file.'
      setErrorMessage(message)
    } finally {
      setIsProcessing(false)
    }
  }

  const fileName = file?.name ?? 'Your Document.pdf'

  return (
    <div className="editor-app">
      <EditorTopBar
        fileName={fileName}
        zoom={zoom}
        onZoomChange={setZoom}
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
            activeSidebarTool={activeSidebarTool}
            activeToolbarTool={activeToolbarTool}
          />
          <EditorToolbar activeTool={activeToolbarTool} onSelectTool={setActiveToolbarTool} />
        </div>
      </div>
    </div>
  )
}
