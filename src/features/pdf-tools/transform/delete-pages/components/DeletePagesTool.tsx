import { FileDropzone, ToolWorkspace } from '../../../shared'

/** Placeholder UI for Delete Pages. Implement behavior in the next step. */
export function DeletePagesTool() {
  return (
    <ToolWorkspace title={'Delete Pages'} description={'Remove unwanted pages from a PDF.'}>
      <FileDropzone />
    </ToolWorkspace>
  )
}
