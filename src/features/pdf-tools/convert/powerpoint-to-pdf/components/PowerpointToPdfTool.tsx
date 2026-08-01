import { FileDropzone, ToolWorkspace } from '../../../shared'

/** Placeholder UI for PowerPoint - PDF. Implement behavior in the next step. */
export function PowerpointToPdfTool() {
  return (
    <ToolWorkspace title={'PowerPoint - PDF'} description={'Convert PowerPoint presentations into PDF files.'}>
      <FileDropzone />
    </ToolWorkspace>
  )
}
