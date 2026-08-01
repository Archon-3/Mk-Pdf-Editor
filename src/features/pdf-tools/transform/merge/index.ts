import type { ToolDefinition } from '../../shared/types'

export const toolMeta: ToolDefinition = {
  id: 'merge',
  name: 'Merge PDF',
  description: 'Combine multiple PDF files into one document.',
  category: 'transform',
  endpoint: '/tools/merge',
  tag: 'Popular',
}

export { MergeTool } from './components/MergeTool'
