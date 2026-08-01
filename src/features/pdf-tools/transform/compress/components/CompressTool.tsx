import { FileDropzone, ToolWorkspace } from '../../../shared'

/** Placeholder UI for Compress PDF. Implement behavior in the next step. */
export function CompressTool() {
  return (
    <ToolWorkspace title={'Compress PDF'} description={'Reduce PDF file size while keeping quality.'}>
      <FileDropzone />
    </ToolWorkspace>
  )
}
