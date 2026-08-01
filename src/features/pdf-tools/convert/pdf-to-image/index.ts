import type { ToolDefinition } from '../../shared/types'

export const toolMeta: ToolDefinition = {
  id: 'pdf-to-image',
  name: 'PDF - Image',
  description: 'Export PDF pages as image files.',
  category: 'convert',
  endpoint: '/tools/pdf-to-image',
}

export { PdfToImageTool } from './components/PdfToImageTool'
