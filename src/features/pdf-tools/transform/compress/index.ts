import type { ToolDefinition } from '../../shared/types'

export const toolMeta: ToolDefinition = {
  id: 'compress',
  name: 'Compress PDF',
  description: 'Reduce PDF file size while keeping quality.',
  category: 'transform',
  endpoint: '/tools/compress',
  tag: 'Popular',
}

export { CompressTool } from './components/CompressTool'
