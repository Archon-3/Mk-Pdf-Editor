import { FileDropzone, ToolWorkspace } from '../../../shared'

/** Placeholder UI for PDF - Image. Implement behavior in the next step. */
export function PdfToImageTool() {
  return (
    <ToolWorkspace title={'PDF - Image'} description={'Export PDF pages as image files.'}>
      <FileDropzone />
    </ToolWorkspace>
  )
}
