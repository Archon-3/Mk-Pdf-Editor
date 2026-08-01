import { FileDropzone, ToolWorkspace } from '../../../shared'

/** Placeholder UI for Split PDF. Implement behavior in the next step. */
export function SplitTool() {
  return (
    <ToolWorkspace title={'Split PDF'} description={'Split a PDF into separate files or page ranges.'}>
      <FileDropzone />
    </ToolWorkspace>
  )
}
