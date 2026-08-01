import type { ToolDefinition } from '../../shared/types'

export const toolMeta: ToolDefinition = {
  id: 'split',
  name: 'Split PDF',
  description: 'Split a PDF into separate files or page ranges.',
  category: 'transform',
  endpoint: '/tools/split',
}

export { SplitTool } from './components/SplitTool'
