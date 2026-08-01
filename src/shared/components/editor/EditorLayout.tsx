import { useState } from 'react'
import type { ToolId } from '../../../features/pdf-tools/shared/types'
import { EditorTopBar } from './EditorTopBar.tsx'
import { EditorSidebar } from './EditorSidebar.tsx'
import { EditorCanvas } from './EditorCanvas.tsx'
import { EditorToolbar } from './EditorToolbar.tsx'

type ToolbarTool = 'select' | 'text' | 'textbox' | 'draw' | 'image' | 'undo' | 'crop' | 'split' | 'page' | 'link' | 'signature'

export function EditorLayout() {
  const [file, setFile] = useState<File | null>(null)
  const [zoom, setZoom] = useState(100)
  const [activeSidebarTool, setActiveSidebarTool] = useState<ToolId | null>(null)
  const [activeToolbarTool, setActiveToolbarTool] = useState<ToolbarTool>('select')

  const fileName = file?.name ?? 'Your Document.pdf'

  return (
    <div className="editor-app">
      <EditorTopBar fileName={fileName} zoom={zoom} onZoomChange={setZoom} />

      <div className="editor-body">
        <EditorSidebar activeTool={activeSidebarTool} onSelectTool={setActiveSidebarTool} />

        <div className="editor-main">
          <EditorCanvas
            zoom={zoom}
            file={file}
            fileName={file ? file.name : null}
            onUpload={setFile}
            activeSidebarTool={activeSidebarTool}
            activeToolbarTool={activeToolbarTool}
          />
          <EditorToolbar activeTool={activeToolbarTool} onSelectTool={setActiveToolbarTool} />
        </div>
      </div>
    </div>
  )
}
