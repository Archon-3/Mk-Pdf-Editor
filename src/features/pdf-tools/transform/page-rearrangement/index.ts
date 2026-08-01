import type { ToolDefinition } from '../../shared/types'

export const toolMeta: ToolDefinition = {
  id: 'page-rearrangement',
  name: 'Page Rearrangement',
  description: 'Reorder pages with drag-and-drop simplicity.',
  category: 'transform',
  endpoint: '/tools/page-rearrangement',
}

export { PageRearrangementTool } from './components/PageRearrangementTool'
