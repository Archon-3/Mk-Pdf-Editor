import type { ToolDefinition } from '../../shared/types'

export const toolMeta: ToolDefinition = {
  id: 'extract-text',
  name: 'Extract Text',
  description: 'Extract text content from PDF pages.',
  category: 'extract',
  endpoint: '/tools/extract-text',
}

export { ExtractTextTool } from './components/ExtractTextTool'
