import type { ToolDefinition } from '../../shared/types'

export const toolMeta: ToolDefinition = {
  id: 'rotate',
  name: 'Rotate PDF',
  description: 'Rotate pages left, right, or upside down.',
  category: 'transform',
  endpoint: '/tools/rotate',
}

export { RotateTool } from './components/RotateTool'
