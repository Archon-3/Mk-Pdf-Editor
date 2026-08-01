import type { ToolDefinition } from '../../shared/types'

export const toolMeta: ToolDefinition = {
  id: 'watermark',
  name: 'Watermark',
  description: 'Add text or image watermarks to your PDF.',
  category: 'edit',
  endpoint: '/tools/watermark',
}

export { WatermarkTool } from './components/WatermarkTool'
