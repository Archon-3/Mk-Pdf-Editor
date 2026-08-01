import { FileDropzone, ToolWorkspace } from '../../../shared'

/** Placeholder UI for Extract Text. Implement behavior in the next step. */
export function ExtractTextTool() {
  return (
    <ToolWorkspace title={'Extract Text'} description={'Extract text content from PDF pages.'}>
      <FileDropzone />
    </ToolWorkspace>
  )
}
