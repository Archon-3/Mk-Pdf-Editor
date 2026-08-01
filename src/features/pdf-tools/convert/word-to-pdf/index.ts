import type { ToolDefinition } from '../../shared/types'

export const toolMeta: ToolDefinition = {
  id: 'word-to-pdf',
  name: 'Word - PDF',
  description: 'Convert Word documents into PDF files.',
  category: 'convert',
  endpoint: '/tools/word-to-pdf',
}

export { WordToPdfTool } from './components/WordToPdfTool'
