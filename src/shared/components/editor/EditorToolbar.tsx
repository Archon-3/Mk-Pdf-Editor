type ToolbarTool = 'select' | 'text' | 'textbox' | 'draw' | 'image' | 'undo' | 'crop' | 'split' | 'page' | 'link' | 'signature'

type EditorToolbarProps = {
  activeTool: ToolbarTool
  onSelectTool: (tool: ToolbarTool) => void
}

const tools: { id: ToolbarTool; label: string; icon: React.ReactNode }[] = [
  {
    id: 'select',
    label: 'Select',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4l7 17 2.5-7.5L21 11 4 4z" />
      </svg>
    ),
  },
  {
    id: 'text',
    label: 'Add text',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 7h16M12 7v14" />
      </svg>
    ),
  },
  {
    id: 'textbox',
    label: 'Text box',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="6" width="16" height="12" rx="2" />
        <path d="M8 10h8M8 14h5" />
      </svg>
    ),
  },
  {
    id: 'draw',
    label: 'Draw',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 20l4-1 9-9-3-3-9 9-1 4z" />
        <path d="M13 7l3 3" />
      </svg>
    ),
  },
  {
    id: 'image',
    label: 'Add image',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="M3 16l5-5 4 4 3-3 6 6" />
      </svg>
    ),
  },
  {
    id: 'undo',
    label: 'Undo',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 14H4V9" />
        <path d="M4 9a8 8 0 1 1 2.3 5.7" />
      </svg>
    ),
  },
  {
    id: 'crop',
    label: 'Crop',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 2v14a2 2 0 0 0 2 2h14" />
        <path d="M18 22V8a2 2 0 0 0-2-2H2" />
      </svg>
    ),
  },
  {
    id: 'split',
    label: 'Split',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="7" height="14" rx="1" />
        <rect x="14" y="5" width="7" height="14" rx="1" />
      </svg>
    ),
  },
  {
    id: 'page',
    label: 'Page',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 7h8M8 11h8" />
      </svg>
    ),
  },
  {
    id: 'link',
    label: 'Link',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1" />
        <path d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" />
      </svg>
    ),
  },
  {
    id: 'signature',
    label: 'Signature',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 18c2-4 4-6 8-6s6 2 8 6" />
        <path d="M6 14c1.5-2 3-3 5-3" />
      </svg>
    ),
  },
]

export function EditorToolbar({ activeTool, onSelectTool }: EditorToolbarProps) {
  return (
    <div className="editor-toolbar">
      {tools.map((tool) => (
        <button
          key={tool.id}
          type="button"
          className={`editor-toolbar-btn ${activeTool === tool.id ? 'active' : ''}`}
          onClick={() => onSelectTool(tool.id)}
          aria-label={tool.label}
          title={tool.label}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  )
}
