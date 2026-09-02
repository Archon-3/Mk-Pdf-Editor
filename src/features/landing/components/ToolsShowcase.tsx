import { Link } from 'react-router-dom'
import { PDF_TOOLS } from '../../pdf-tools/index.ts'

const toolIcons: Record<string, React.ReactNode> = {
  merge: (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 4H24C26.2091 4 28 5.79086 28 8V24C28 26.2091 26.2091 28 24 28H8C5.79086 28 4 26.2091 4 24V8C4 5.79086 5.79086 4 8 4Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 12H20M12 16H20M12 20H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  split: (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 4H14C16.2091 4 18 5.79086 18 8V24C18 26.2091 16.2091 28 14 28H8C5.79086 28 4 26.2091 4 24V8C4 5.79086 5.79086 4 8 4Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M18 4H24C26.2091 4 28 5.79086 28 8V24C28 26.2091 26.2091 28 24 28H18" stroke="currentColor" strokeWidth="2"/>
      <path d="M16 8L18 10L16 12M16 20L18 22L16 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  compress: (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 4H24C26.2091 4 28 5.79086 28 8V24C28 26.2091 26.2091 28 24 28H8C5.79086 28 4 26.2091 4 24V8C4 5.79086 5.79086 4 8 4Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M10 10L22 22M22 10L10 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  rotate: (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 4H24C26.2091 4 28 5.79086 28 8V24C28 26.2091 26.2091 28 24 28H8C5.79086 28 4 26.2091 4 24V8C4 5.79086 5.79086 4 8 4Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M16 10V22M10 16H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'delete-pages': (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 4H24C26.2091 4 28 5.79086 28 8V24C28 26.2091 26.2091 28 24 28H8C5.79086 28 4 26.2091 4 24V8C4 5.79086 5.79086 4 8 4Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M10 12H22M10 16H18M10 20H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M22 8L24 10M24 8L22 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'page-rearrangement': (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 4H24C26.2091 4 28 5.79086 28 8V24C28 26.2091 26.2091 28 24 28H8C5.79086 28 4 26.2091 4 24V8C4 5.79086 5.79086 4 8 4Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 10L16 14L20 10M16 14V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'pdf-to-word': (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 4H20L28 12V24C28 26.2091 26.2091 28 24 28H8C5.79086 28 4 26.2091 4 24V8C4 5.79086 5.79086 4 8 4Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M20 4V12H28" stroke="currentColor" strokeWidth="2"/>
      <path d="M10 18H22M10 22H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'word-to-pdf': (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4H16L24 12V24C24 26.2091 22.2091 28 20 28H4C1.79086 28 0 26.2091 0 24V8C0 5.79086 1.79086 4 4 4Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M16 4V12H24" stroke="currentColor" strokeWidth="2"/>
      <path d="M6 18H18M6 22H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'excel-to-pdf': (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4H16L24 12V24C24 26.2091 22.2091 28 20 28H4C1.79086 28 0 26.2091 0 24V8C0 5.79086 1.79086 4 4 4Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M16 4V12H24" stroke="currentColor" strokeWidth="2"/>
      <path d="M6 10H10M6 14H14M6 18H14M6 22H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'powerpoint-to-pdf': (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4H16L24 12V24C24 26.2091 22.2091 28 20 28H4C1.79086 28 0 26.2091 0 24V8C0 5.79086 1.79086 4 4 4Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M16 4V12H24" stroke="currentColor" strokeWidth="2"/>
      <rect x="6" y="10" width="12" height="8" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  'image-to-pdf': (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 4H24C26.2091 4 28 5.79086 28 8V24C28 26.2091 26.2091 28 24 28H8C5.79086 28 4 26.2091 4 24V8C4 5.79086 5.79086 4 8 4Z" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
      <path d="M8 20L12 16L16 20L20 14L24 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'pdf-to-image': (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 4H24C26.2091 4 28 5.79086 28 8V24C28 26.2091 26.2091 28 24 28H8C5.79086 28 4 26.2091 4 24V8C4 5.79086 5.79086 4 8 4Z" stroke="currentColor" strokeWidth="2"/>
      <rect x="8" y="8" width="6" height="6" stroke="currentColor" strokeWidth="2"/>
      <rect x="18" y="8" width="6" height="6" stroke="currentColor" strokeWidth="2"/>
      <rect x="8" y="18" width="6" height="6" stroke="currentColor" strokeWidth="2"/>
      <rect x="18" y="18" width="6" height="6" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  'extract-images': (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 4H24C26.2091 4 28 5.79086 28 8V24C28 26.2091 26.2091 28 24 28H8C5.79086 28 4 26.2091 4 24V8C4 5.79086 5.79086 4 8 4Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M10 10L14 14L10 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M22 10L18 14L22 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'extract-text': (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 4H24C26.2091 4 28 5.79086 28 8V24C28 26.2091 26.2091 28 24 28H8C5.79086 28 4 26.2091 4 24V8C4 5.79086 5.79086 4 8 4Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M10 12H22M10 16H18M10 20H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'extract-tables': (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 4H24C26.2091 4 28 5.79086 28 8V24C28 26.2091 26.2091 28 24 28H8C5.79086 28 4 26.2091 4 24V8C4 5.79086 5.79086 4 8 4Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M10 10H22V22H10V10Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M10 14H22M10 18H22M16 10V22" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  watermark: (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 4H24C26.2091 4 28 5.79086 28 8V24C28 26.2091 26.2091 28 24 28H8C5.79086 28 4 26.2091 4 24V8C4 5.79086 5.79086 4 8 4Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M10 18C10 15.2386 12.2386 13 15 13H17C19.7614 13 22 15.2386 22 18" stroke="currentColor" strokeWidth="2"/>
      <circle cx="16" cy="10" r="2" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  redaction: (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 4H24C26.2091 4 28 5.79086 28 8V24C28 26.2091 26.2091 28 24 28H8C5.79086 28 4 26.2091 4 24V8C4 5.79086 5.79086 4 8 4Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M8 12H24M8 16H20M8 20H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M22 16L26 12M22 16L26 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  annotation: (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 4H24C26.2091 4 28 5.79086 28 8V24C28 26.2091 26.2091 28 24 28H8C5.79086 28 4 26.2091 4 24V8C4 5.79086 5.79086 4 8 4Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M10 10L14 14M18 18L22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="16" cy="16" r="2" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  signature: (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 4H24C26.2091 4 28 5.79086 28 8V24C28 26.2091 26.2091 28 24 28H8C5.79086 28 4 26.2091 4 24V8C4 5.79086 5.79086 4 8 4Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M10 18C10 18 12 14 16 14C20 14 22 18 22 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M10 22C10 22 14 16 18 16C22 16 22 22 22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
}

export function ToolsShowcase() {
  return (
    <section className="tools-showcase" id="tools">
      <h2>Powerful Tools for Every PDF Task</h2>
      <div className="tools-grid">
        {PDF_TOOLS.map((tool) => (
          <Link to={`/tools/${tool.id}`} className="tool-tile" key={tool.id}>
            <div className="tool-icon">
              {toolIcons[tool.id] || (
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 4H24C26.2091 4 28 5.79086 28 8V24C28 26.2091 26.2091 28 24 28H8C5.79086 28 4 26.2091 4 24V8C4 5.79086 5.79086 4 8 4Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              )}
            </div>
            <div className="tool-content">
              <h4>{tool.name}</h4>
              <p>{tool.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
