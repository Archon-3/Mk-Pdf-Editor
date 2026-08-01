import type { ToolDefinition } from '../../shared/types'

export const toolMeta: ToolDefinition = {
  id: 'delete-pages',
  name: 'Delete Pages',
  description: 'Remove unwanted pages from a PDF.',
  category: 'transform',
  endpoint: '/tools/delete-pages',
}

export { DeletePagesTool } from './components/DeletePagesTool'
