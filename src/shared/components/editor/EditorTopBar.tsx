type EditorTopBarProps = {
  fileName: string
  zoom: number
  onZoomChange: (zoom: number) => void
}

export function EditorTopBar({ fileName, zoom, onZoomChange }: EditorTopBarProps) {
  const zoomOut = () => onZoomChange(Math.max(50, zoom - 10))
  const zoomIn = () => onZoomChange(Math.min(200, zoom + 10))

  return (
    <header className="editor-topbar">
      <div className="editor-topbar-left">
        <div className="window-dots" aria-hidden="true">
          <span className="dot red" />
          <span className="dot yellow" />
          <span className="dot green" />
        </div>
        <div className="doc-title">
          <span>{fileName}</span>
          <button type="button" className="editor-icon-btn" aria-label="Rename document">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="editor-topbar-center">
        <button type="button" className="editor-icon-btn" onClick={zoomOut} aria-label="Zoom out">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button type="button" className="zoom-select">
          {zoom}%
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <button type="button" className="editor-icon-btn" onClick={zoomIn} aria-label="Zoom in">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className="editor-topbar-right">
        <button type="button" className="editor-icon-btn" aria-label="History">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
          </svg>
        </button>
        <button type="button" className="editor-icon-btn" aria-label="View mode">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M7 8h10M7 12h6" />
          </svg>
        </button>
        <button type="button" className="editor-icon-btn" aria-label="More options">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none" />
          </svg>
        </button>
        <button type="button" className="editor-download-btn">
          Download
        </button>
      </div>
    </header>
  )
}
