import { FileDropzone, ToolWorkspace } from '../../../shared'

/** Placeholder UI for Extract Tables. Implement behavior in the next step. */
export function ExtractTablesTool() {
  return (
    <ToolWorkspace title={'Extract Tables'} description={'Extract table data from PDF documents.'}>
      <FileDropzone />
    </ToolWorkspace>
  )
}
