import { EditorLayout } from '../../shared/components/editor'
import { SeoHead } from '../../shared/seo'
import '../../styles/editor.css'

/** Full editor workspace without a preselected tool (not the SEO tools directory). */
export function WorkspacePage() {
  return (
    <div className="tools-editor-page">
      <SeoHead
        title="PDF Workspace | MK PDF Editor"
        description="Upload and edit PDFs in the MK PDF Editor workspace. Choose any tool from the sidebar."
        path="/workspace"
        noIndex
      />
      <EditorLayout />
    </div>
  )
}
