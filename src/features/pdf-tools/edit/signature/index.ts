import type { ToolDefinition } from '../../shared/types'

export const toolMeta: ToolDefinition = {
  id: 'signature',
  name: 'Signature',
  description: 'Add electronic signatures to your documents.',
  category: 'edit',
  endpoint: '/tools/signature',
}

export { SignatureTool } from './components/SignatureTool'
