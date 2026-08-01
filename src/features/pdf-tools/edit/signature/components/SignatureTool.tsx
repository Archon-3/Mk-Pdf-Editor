import { FileDropzone, ToolWorkspace } from '../../../shared'

/** Placeholder UI for Signature. Implement behavior in the next step. */
export function SignatureTool() {
  return (
    <ToolWorkspace title={'Signature'} description={'Add electronic signatures to your documents.'}>
      <FileDropzone />
    </ToolWorkspace>
  )
}
