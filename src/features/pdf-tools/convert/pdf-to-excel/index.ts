import type { ToolDefinition } from '../../shared/types'

export const toolMeta: ToolDefinition = {
  id: 'pdf-to-excel', name: 'PDF → Excel', description: 'Convert PDF tables and text into an editable Excel workbook.', category: 'convert', endpoint: '/tools/pdf-to-excel',
}