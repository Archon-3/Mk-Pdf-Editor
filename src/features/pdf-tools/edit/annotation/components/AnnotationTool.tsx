import { FileDropzone, ToolWorkspace } from '../../../shared'

/** Placeholder UI for Annotation. Implement behavior in the next step. */
export function AnnotationTool() {
  return (
    <ToolWorkspace title={'Annotation'} description={'Highlight, comment, and mark up PDF pages.'}>
      <FileDropzone />
    </ToolWorkspace>
  )
}
