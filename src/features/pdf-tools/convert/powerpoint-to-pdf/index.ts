import type { ToolDefinition } from '../../shared/types'

export const toolMeta: ToolDefinition = {
  id: 'powerpoint-to-pdf',
  name: 'PowerPoint - PDF',
  description: 'Convert PowerPoint presentations into PDF files.',
  category: 'convert',
  endpoint: '/tools/powerpoint-to-pdf',
}

export { PowerpointToPdfTool } from './components/PowerpointToPdfTool'
