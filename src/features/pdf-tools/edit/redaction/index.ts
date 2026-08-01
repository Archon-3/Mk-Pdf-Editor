import type { ToolDefinition } from '../../shared/types'

export const toolMeta: ToolDefinition = {
  id: 'redaction',
  name: 'Redaction',
  description: 'Permanently black out sensitive information.',
  category: 'edit',
  endpoint: '/tools/redaction',
  tag: 'Pro',
}

export { RedactionTool } from './components/RedactionTool'
