import type { ToolDefinition } from '../../shared/types'

export const toolMeta: ToolDefinition = {
  id: 'extract-tables',
  name: 'Extract Tables',
  description: 'Extract table data from PDF documents.',
  category: 'extract',
  endpoint: '/tools/extract-tables',
}

export { ExtractTablesTool } from './components/ExtractTablesTool'
