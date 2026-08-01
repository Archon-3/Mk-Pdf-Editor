import { FileDropzone, ToolWorkspace } from '../../../shared'

/** Placeholder UI for Excel - PDF. Implement behavior in the next step. */
export function ExcelToPdfTool() {
  return (
    <ToolWorkspace title={'Excel - PDF'} description={'Convert Excel spreadsheets into PDF files.'}>
      <FileDropzone />
    </ToolWorkspace>
  )
}
