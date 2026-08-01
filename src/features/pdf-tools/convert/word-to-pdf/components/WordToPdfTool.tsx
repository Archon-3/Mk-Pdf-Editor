import { FileDropzone, ToolWorkspace } from '../../../shared'

/** Placeholder UI for Word - PDF. Implement behavior in the next step. */
export function WordToPdfTool() {
  return (
    <ToolWorkspace title={'Word - PDF'} description={'Convert Word documents into PDF files.'}>
      <FileDropzone />
    </ToolWorkspace>
  )
}
