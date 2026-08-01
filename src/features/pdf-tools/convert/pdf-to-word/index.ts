import type { ToolDefinition } from '../../shared/types'

export const toolMeta: ToolDefinition = {
  id: 'pdf-to-word',
  name: 'PDF - Word',
  description: 'Convert PDF documents to editable Word files.',
  category: 'convert',
  endpoint: '/tools/pdf-to-word',
}

export { PdfToWordTool } from './components/PdfToWordTool'
