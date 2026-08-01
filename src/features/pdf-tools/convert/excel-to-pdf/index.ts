import type { ToolDefinition } from '../../shared/types'

export const toolMeta: ToolDefinition = {
  id: 'excel-to-pdf',
  name: 'Excel - PDF',
  description: 'Convert Excel spreadsheets into PDF files.',
  category: 'convert',
  endpoint: '/tools/excel-to-pdf',
}

export { ExcelToPdfTool } from './components/ExcelToPdfTool'
