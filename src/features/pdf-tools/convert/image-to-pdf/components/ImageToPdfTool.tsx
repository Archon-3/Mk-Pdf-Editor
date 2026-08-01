import { FileDropzone, ToolWorkspace } from '../../../shared'

/** Placeholder UI for Image - PDF. Implement behavior in the next step. */
export function ImageToPdfTool() {
  return (
    <ToolWorkspace title={'Image - PDF'} description={'Convert images into a single PDF document.'}>
      <FileDropzone />
    </ToolWorkspace>
  )
}
