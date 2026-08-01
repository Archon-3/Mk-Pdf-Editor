import type { ReactNode } from 'react'

function iconProps() {
  return {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
}

function iconFlow() {
  return (
    <svg {...iconProps()}>
      <path d="M4 7h7v5" />
      <path d="M20 17h-7v-5" />
      <path d="M11 14l2-2" />
    </svg>
  )
}

function iconSplit() {
  return (
    <svg {...iconProps()}>
      <rect x="3" y="5" width="7" height="14" rx="1.2" />
      <rect x="14" y="5" width="7" height="14" rx="1.2" />
    </svg>
  )
}

function iconCompress() {
  return (
    <svg {...iconProps()}>
      <path d="M7 7h10" />
      <path d="M7 12h10" />
      <path d="M7 17h6" />
      <path d="M17 17h0" />
    </svg>
  )
}

function iconRotate() {
  return (
    <svg {...iconProps()}>
      <path d="M20 6v6h-6" />
      <path d="M20 12a8 8 0 1 1-2.35-5.65" />
    </svg>
  )
}

function iconDelete() {
  return (
    <svg {...iconProps()}>
      <path d="M4 6h16" />
      <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" />
      <path d="M10 10v6M14 10v6" />
    </svg>
  )
}

function iconText() {
  return (
    <svg {...iconProps()}>
      <path d="M4 7h16" />
      <path d="M7 12h10" />
      <path d="M7 16h6" />
    </svg>
  )
}

function iconImage() {
  return (
    <svg {...iconProps()}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 15l5-5 4 4 3-3 6 6" />
      <circle cx="9" cy="8" r="1" />
    </svg>
  )
}

function iconTable() {
  return (
    <svg {...iconProps()}>
      <rect x="4" y="5" width="16" height="14" rx="1.5" />
      <path d="M4 11h16M10 5v14" />
    </svg>
  )
}

function iconDoc() {
  return (
    <svg {...iconProps()}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  )
}

function iconSlide() {
  return (
    <svg {...iconProps()}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="7" y="8" width="10" height="8" rx="1" />
    </svg>
  )
}

function iconPen() {
  return (
    <svg {...iconProps()}>
      <path d="M4 20l4-1 9-9-3-3-9 9-1 4z" />
      <path d="M13 7l3 3" />
    </svg>
  )
}

function iconDrop() {
  return (
    <svg {...iconProps()}>
      <path d="M12 3s5 5 5 9a5 5 0 1 1-10 0c0-4 5-9 5-9z" />
    </svg>
  )
}

function iconGrid() {
  return (
    <svg {...iconProps()}>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </svg>
  )
}

export function getToolIcon(name: string): ReactNode {
  const n = name.toLowerCase()

  if (n.includes('merge')) return iconFlow()
  if (n.includes('split')) return iconSplit()
  if (n.includes('compress')) return iconCompress()
  if (n.includes('rotate')) return iconRotate()
  if (n.includes('delete') || n.includes('redaction')) return iconDelete()
  if (n.includes('extract') || n.includes('text') || n.includes('tables')) return iconText()
  if (n.includes('image')) return iconImage()
  if (n.includes('excel')) return iconTable()
  if (n.includes('word')) return iconDoc()
  if (n.includes('powerpoint')) return iconSlide()
  if (n.includes('annotation') || n.includes('signature')) return iconPen()
  if (n.includes('watermark')) return iconDrop()
  if (n.includes('rearrang') || n.includes('page')) return iconGrid()

  return iconDoc()
}
