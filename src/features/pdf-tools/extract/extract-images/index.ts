import type { ToolDefinition } from '../../shared/types'

export const toolMeta: ToolDefinition = {
  id: 'extract-images',
  name: 'Extract Images',
  description: 'Pull images out of a PDF file.',
  category: 'extract',
  endpoint: '/tools/extract-images',
}

export { ExtractImagesTool } from './components/ExtractImagesTool'
