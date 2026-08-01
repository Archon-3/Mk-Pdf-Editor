import { FileDropzone, ToolWorkspace } from '../../../shared'

/** Placeholder UI for Extract Images. Implement behavior in the next step. */
export function ExtractImagesTool() {
  return (
    <ToolWorkspace title={'Extract Images'} description={'Pull images out of a PDF file.'}>
      <FileDropzone />
    </ToolWorkspace>
  )
}
