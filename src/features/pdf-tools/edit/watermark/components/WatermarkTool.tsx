import { FileDropzone, ToolWorkspace } from '../../../shared'

/** Placeholder UI for Watermark. Implement behavior in the next step. */
export function WatermarkTool() {
  return (
    <ToolWorkspace title={'Watermark'} description={'Add text or image watermarks to your PDF.'}>
      <FileDropzone />
    </ToolWorkspace>
  )
}
