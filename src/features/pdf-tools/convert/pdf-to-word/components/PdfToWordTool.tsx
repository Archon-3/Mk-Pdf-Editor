import { FileDropzone, ToolWorkspace } from '../../../shared'

/** Placeholder UI for PDF - Word. Implement behavior in the next step. */
export function PdfToWordTool() {
  return (
    <ToolWorkspace title={'PDF - Word'} description={'Convert PDF documents to editable Word files.'}>
      <FileDropzone />
    </ToolWorkspace>
  )
}
