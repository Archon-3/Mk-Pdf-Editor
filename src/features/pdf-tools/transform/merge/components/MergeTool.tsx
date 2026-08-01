import { FileDropzone, ToolWorkspace } from '../../../shared'

/** Placeholder UI for Merge PDF. Implement behavior in the next step. */
export function MergeTool() {
  return (
    <ToolWorkspace title={'Merge PDF'} description={'Combine multiple PDF files into one document.'}>
      <FileDropzone />
    </ToolWorkspace>
  )
}
