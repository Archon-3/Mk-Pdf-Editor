import type { ToolDefinition } from '../../shared/types'

export const toolMeta: ToolDefinition = {
  id: 'image-to-pdf',
  name: 'Image - PDF',
  description: 'Convert images into a single PDF document.',
  category: 'convert',
  endpoint: '/tools/image-to-pdf',
}

export { ImageToPdfTool } from './components/ImageToPdfTool'
