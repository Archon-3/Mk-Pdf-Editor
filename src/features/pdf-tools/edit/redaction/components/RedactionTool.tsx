import { FileDropzone, ToolWorkspace } from '../../../shared'

/** Placeholder UI for Redaction. Implement behavior in the next step. */
export function RedactionTool() {
  return (
    <ToolWorkspace title={'Redaction'} description={'Permanently black out sensitive information.'}>
      <FileDropzone />
    </ToolWorkspace>
  )
}
