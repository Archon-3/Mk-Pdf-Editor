import { FileDropzone, ToolWorkspace } from '../../../shared'

/** Placeholder UI for Rotate PDF. Implement behavior in the next step. */
export function RotateTool() {
  return (
    <ToolWorkspace title={'Rotate PDF'} description={'Rotate pages left, right, or upside down.'}>
      <FileDropzone />
    </ToolWorkspace>
  )
}
