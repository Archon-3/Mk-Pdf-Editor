import { useParams } from 'react-router-dom'
import { getToolById } from '../../features/pdf-tools'
import { EditorLayout } from '../../shared/components/editor'

export function ToolPage() {
  const { toolId = '' } = useParams()
  const tool = getToolById(toolId)

  if (!tool) {
    return (
      <section className="tool-workspace">
        <h1>Tool not found</h1>
        <p>The requested PDF tool does not exist.</p>
      </section>
    )
  }

  return <EditorLayout initialToolId={tool.id} />
}
