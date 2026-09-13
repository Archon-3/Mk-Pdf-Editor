import type { ToolId } from '../../features/pdf-tools'

export const SITE_NAME = 'MK PDF Editor'
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://mkpdfeditor.com').replace(/\/$/, '')
export const DEFAULT_DESCRIPTION =
  'Free online PDF editor: merge, split, compress, convert PDF to Word/Excel/PowerPoint, extract text, and more. Works in Chrome, Edge, Firefox, and Bing.'

export type SeoPayload = {
  title: string
  description: string
  path: string
  keywords?: string[]
  type?: 'website' | 'article'
  noIndex?: boolean
}

export type ToolSeo = SeoPayload & {
  toolId: ToolId
  h1: string
  howToSteps?: string[]
}

/** Per-tool SEO copy aimed at Google / Bing / DuckDuckGo discovery. */
export const TOOL_SEO: Record<ToolId, ToolSeo> = {
  merge: {
    toolId: 'merge',
    path: '/tools/merge',
    h1: 'Merge PDF files online',
    title: 'Merge PDF Online Free | Combine PDF Files — MK PDF Editor',
    description:
      'Merge multiple PDF files into one document online for free. Fast combine PDF tool in your browser — Chrome, Edge, Firefox. No install required.',
    keywords: ['merge pdf', 'combine pdf', 'join pdf files', 'merge pdf online free'],
    howToSteps: ['Upload two or more PDFs', 'Arrange order if needed', 'Click Run', 'Download the merged PDF'],
  },
  split: {
    toolId: 'split',
    path: '/tools/split',
    h1: 'Split PDF online',
    title: 'Split PDF Online Free | Separate PDF Pages — MK PDF Editor',
    description:
      'Split a PDF into separate files by pages online. Free PDF splitter that works in Chrome, Bing, Edge, and Firefox browsers.',
    keywords: ['split pdf', 'separate pdf pages', 'pdf splitter online', 'extract pdf pages'],
  },
  compress: {
    toolId: 'compress',
    path: '/tools/compress',
    h1: 'Compress PDF online',
    title: 'Compress PDF Online Free | Reduce PDF Size — MK PDF Editor',
    description:
      'Compress PDF files online to reduce size while keeping quality. Free PDF compressor for email and uploads — works in any modern browser.',
    keywords: ['compress pdf', 'reduce pdf size', 'pdf compressor online', 'shrink pdf'],
  },
  rotate: {
    toolId: 'rotate',
    path: '/tools/rotate',
    h1: 'Rotate PDF pages online',
    title: 'Rotate PDF Online Free | Fix Page Orientation — MK PDF Editor',
    description:
      'Rotate PDF pages left or right online for free. Fix sideways scans instantly in Chrome, Edge, or Firefox.',
    keywords: ['rotate pdf', 'rotate pdf pages', 'fix pdf orientation online'],
  },
  'delete-pages': {
    toolId: 'delete-pages',
    path: '/tools/delete-pages',
    h1: 'Delete PDF pages online',
    title: 'Delete PDF Pages Online Free — MK PDF Editor',
    description:
      'Remove unwanted pages from a PDF online. Free delete PDF pages tool — no desktop software needed.',
    keywords: ['delete pdf pages', 'remove pages from pdf', 'pdf page remover'],
  },
  'page-rearrangement': {
    toolId: 'page-rearrangement',
    path: '/tools/page-rearrangement',
    h1: 'Rearrange PDF pages online',
    title: 'Rearrange PDF Pages Online Free | Reorder PDF — MK PDF Editor',
    description:
      'Reorder PDF pages online for free. Drag-friendly page rearrangement for documents, homework, and contracts.',
    keywords: ['rearrange pdf pages', 'reorder pdf', 'move pdf pages online'],
  },
  'pdf-to-word': {
    toolId: 'pdf-to-word',
    path: '/tools/pdf-to-word',
    h1: 'Convert PDF to Word online',
    title: 'PDF to Word Converter Online Free | PDF to DOC/DOCX — MK PDF Editor',
    description:
      'Convert PDF to Word (DOCX) online for free. Editable text, tables, and images. Best free PDF to Word tool in your browser.',
    keywords: [
      'pdf to word',
      'pdf to docx',
      'convert pdf to word online free',
      'pdf to word converter',
    ],
  },
  'pdf-to-excel': {
    toolId: 'pdf-to-excel',
    path: '/tools/pdf-to-excel',
    h1: 'Convert PDF to Excel online',
    title: 'PDF to Excel Converter Online Free | PDF to XLSX — MK PDF Editor',
    description:
      'Convert PDF tables to Excel spreadsheets online. Free PDF to Excel (XLSX) converter for Chrome, Edge, and Firefox.',
    keywords: ['pdf to excel', 'pdf to xlsx', 'convert pdf to excel online free'],
  },
  'pdf-to-powerpoint': {
    toolId: 'pdf-to-powerpoint',
    path: '/tools/pdf-to-powerpoint',
    h1: 'Convert PDF to PowerPoint online',
    title: 'PDF to PowerPoint Converter Online Free | PDF to PPTX — MK PDF Editor',
    description:
      'Turn PDF pages into PowerPoint slides online for free. Fast PDF to PPTX conversion in your browser.',
    keywords: ['pdf to powerpoint', 'pdf to pptx', 'convert pdf to powerpoint online'],
  },
  'word-to-pdf': {
    toolId: 'word-to-pdf',
    path: '/tools/word-to-pdf',
    h1: 'Convert Word to PDF online',
    title: 'Word to PDF Converter Online Free | DOC/DOCX to PDF — MK PDF Editor',
    description:
      'Convert Word documents to PDF online for free. High-quality DOC/DOCX to PDF in Chrome, Edge, Firefox, and Bing.',
    keywords: ['word to pdf', 'docx to pdf', 'convert word to pdf online free'],
  },
  'excel-to-pdf': {
    toolId: 'excel-to-pdf',
    path: '/tools/excel-to-pdf',
    h1: 'Convert Excel to PDF online',
    title: 'Excel to PDF Converter Online Free | XLSX to PDF — MK PDF Editor',
    description:
      'Convert Excel spreadsheets to PDF online. Free XLS/XLSX to PDF converter — share sheets as polished PDFs.',
    keywords: ['excel to pdf', 'xlsx to pdf', 'convert excel to pdf online'],
  },
  'powerpoint-to-pdf': {
    toolId: 'powerpoint-to-pdf',
    path: '/tools/powerpoint-to-pdf',
    h1: 'Convert PowerPoint to PDF online',
    title: 'PowerPoint to PDF Converter Online Free | PPTX to PDF — MK PDF Editor',
    description:
      'Convert PowerPoint presentations to PDF online for free. Keep slides crisp for sharing and printing.',
    keywords: ['powerpoint to pdf', 'pptx to pdf', 'convert ppt to pdf online'],
  },
  'image-to-pdf': {
    toolId: 'image-to-pdf',
    path: '/tools/image-to-pdf',
    h1: 'Convert images to PDF online',
    title: 'JPG/PNG to PDF Converter Online Free — MK PDF Editor',
    description:
      'Convert JPG, PNG, and other images to PDF online for free. Combine photos into one PDF file in your browser.',
    keywords: ['jpg to pdf', 'png to pdf', 'image to pdf', 'convert photo to pdf'],
  },
  'pdf-to-image': {
    toolId: 'pdf-to-image',
    path: '/tools/pdf-to-image',
    h1: 'Convert PDF to images online',
    title: 'PDF to JPG/PNG Converter Online Free — MK PDF Editor',
    description:
      'Export PDF pages to JPG or PNG images online. Free PDF to image converter for screenshots, slides, and sharing.',
    keywords: ['pdf to jpg', 'pdf to png', 'pdf to image', 'convert pdf to pictures'],
  },
  'extract-images': {
    toolId: 'extract-images',
    path: '/tools/extract-images',
    h1: 'Extract images from PDF online',
    title: 'Extract Images from PDF Online Free — MK PDF Editor',
    description:
      'Extract embedded images from any PDF online. Download pictures from PDF files for free in your browser.',
    keywords: ['extract images from pdf', 'pdf image extractor', 'save images from pdf'],
  },
  'extract-text': {
    toolId: 'extract-text',
    path: '/tools/extract-text',
    h1: 'Extract text from PDF online',
    title: 'Extract Text from PDF Online Free | PDF to TXT — MK PDF Editor',
    description:
      'Copy and extract text from PDF online for free. Fast PDF text extraction tool — no install.',
    keywords: ['extract text from pdf', 'pdf to txt', 'copy text from pdf online'],
  },
  'extract-tables': {
    toolId: 'extract-tables',
    path: '/tools/extract-tables',
    h1: 'Extract tables from PDF online',
    title: 'Extract Tables from PDF Online Free | PDF to CSV — MK PDF Editor',
    description:
      'Extract tables from PDF to CSV online. Free PDF table extractor for reports, invoices, and data work.',
    keywords: ['extract tables from pdf', 'pdf to csv', 'pdf table extractor'],
  },
  watermark: {
    toolId: 'watermark',
    path: '/tools/watermark',
    h1: 'Add watermark to PDF online',
    title: 'Add Watermark to PDF Online Free — MK PDF Editor',
    description:
      'Add text watermarks to PDF files online for free. Brand or protect documents in Chrome, Edge, and Firefox.',
    keywords: ['pdf watermark', 'add watermark to pdf', 'watermark pdf online free'],
  },
  redaction: {
    toolId: 'redaction',
    path: '/tools/redaction',
    h1: 'Redact PDF online',
    title: 'Redact PDF Online Free | Black Out Sensitive Text — MK PDF Editor',
    description:
      'Redact sensitive information in PDFs online. Free PDF redaction tool to black out private data before sharing.',
    keywords: ['redact pdf', 'black out pdf text', 'pdf redaction online'],
  },
  annotation: {
    toolId: 'annotation',
    path: '/tools/annotation',
    h1: 'Annotate PDF online',
    title: 'Annotate PDF Online Free | Add Notes to PDF — MK PDF Editor',
    description:
      'Add annotations and notes to PDFs online for free. Simple PDF markup in your browser.',
    keywords: ['annotate pdf', 'pdf notes online', 'markup pdf free'],
  },
  signature: {
    toolId: 'signature',
    path: '/tools/signature',
    h1: 'Sign PDF online',
    title: 'Sign PDF Online Free | Add Signature to PDF — MK PDF Editor',
    description:
      'Add a signature to PDF online for free. Sign contracts and forms in Chrome, Edge, Firefox — no print needed.',
    keywords: ['sign pdf', 'add signature to pdf', 'electronic signature pdf online'],
  },
}

export const PAGE_SEO: Record<string, SeoPayload> = {
  home: {
    path: '/',
    title: 'MK PDF Editor | Free Online PDF Tools — Merge, Convert, Compress',
    description: DEFAULT_DESCRIPTION,
    keywords: ['pdf editor online', 'free pdf tools', 'merge pdf', 'pdf to word', 'compress pdf'],
  },
  tools: {
    path: '/tools',
    title: 'All PDF Tools Online Free | MK PDF Editor Tool Directory',
    description:
      'Browse every MK PDF Editor tool: merge, split, compress, PDF to Word, Word to PDF, extract text, watermark, and more. Free online PDF utilities.',
    keywords: ['pdf tools', 'online pdf editor', 'free pdf converter'],
  },
  pricing: {
    path: '/pricing',
    title: 'Pricing | Free & Pro PDF Plans — MK PDF Editor',
    description: 'Compare Free and Pro plans for MK PDF Editor. Larger files, more daily runs, and PayPal checkout.',
  },
  support: {
    path: '/support',
    title: 'Help & Support | MK PDF Editor',
    description: 'Get help with MK PDF Editor tools, billing, and account questions.',
  },
  admin: {
    path: '/admin',
    title: 'Admin | MK PDF Editor',
    description: 'Admin control center',
    noIndex: true,
  },
}

export function absoluteUrl(path: string) {
  if (path.startsWith('http')) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export function getToolSeo(toolId: string): ToolSeo | undefined {
  return TOOL_SEO[toolId as ToolId]
}
