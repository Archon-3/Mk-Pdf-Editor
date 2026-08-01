import { FileDropzone, ToolWorkspace } from '../../../shared'

/** Placeholder UI for Page Rearrangement. Implement behavior in the next step. */
export function PageRearrangementTool() {
  return (
    <ToolWorkspace title={'Page Rearrangement'} description={'Reorder pages with drag-and-drop simplicity.'}>
      <FileDropzone />
    </ToolWorkspace>
  )
}
