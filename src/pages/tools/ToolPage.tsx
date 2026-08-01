import { useParams } from 'react-router-dom'
import { getToolById } from '../../features/pdf-tools'

/**
 * Route shell for individual tools.
 * Next step: map toolId -> feature component and render it here.
 */
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

  return (
    <section className="tool-workspace">
      <h1>{tool.name}</h1>
      <p>{tool.description}</p>
      <p>Tool UI will be wired in the next step.</p>
    </section>
  )
}
