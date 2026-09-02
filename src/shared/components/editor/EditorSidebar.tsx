import { useNavigate } from 'react-router-dom'
import { PDF_TOOLS } from '../../../features/pdf-tools/index.ts'
import { getToolIcon } from '../../utils/toolIcons.tsx'
import type { ToolId } from '../../../features/pdf-tools/shared/types'

type EditorSidebarProps = {
  activeTool: ToolId | null
  onSelectTool: (toolId: ToolId) => void
}

const railIcons = [
  { id: 'tools', label: 'All Tools' },
  { id: 'pages', label: 'Pages' },
  { id: 'bookmarks', label: 'Bookmarks' },
  { id: 'search', label: 'Search' },
] as const

export function EditorSidebar({ activeTool, onSelectTool }: EditorSidebarProps) {
  const navigate = useNavigate()

  const handleToolClick = (toolId: ToolId) => {
    onSelectTool(toolId)
    navigate(`/tools/${toolId}`)
  }

  return (
    <aside className="editor-sidebar-wrap">
      <nav className="editor-rail" aria-label="Quick navigation">
        {railIcons.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`rail-btn ${index === 0 ? 'active' : ''}`}
            aria-label={item.label}
            title={item.label}
          >
            {index === 0 && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            )}
            {index === 1 && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <path d="M8 7h8M8 11h8M8 15h5" />
              </svg>
            )}
            {index === 2 && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 4h12a2 2 0 0 1 2 2v14l-4-3-4 3-4-3-4 3V6a2 2 0 0 1 2-2z" />
              </svg>
            )}
            {index === 3 && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3-3" />
              </svg>
            )}
          </button>
        ))}
      </nav>

      <div className="editor-sidebar">
        <h2 className="editor-sidebar-title">All Tools</h2>
        <ul className="editor-tools-list">
          {PDF_TOOLS.map((tool) => (
            <li key={tool.id}>
              <button
                type="button"
                className={`editor-tool-list-item ${activeTool === tool.id ? 'active' : ''}`}
                onClick={() => handleToolClick(tool.id)}
              >
                <span className="editor-tool-list-icon">{getToolIcon(tool.name)}</span>
                <span className="editor-tool-list-label">{tool.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
