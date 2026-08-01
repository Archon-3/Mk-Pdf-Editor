import type { ToolDefinition } from '../../shared/types'

export const toolMeta: ToolDefinition = {
  id: 'annotation',
  name: 'Annotation',
  description: 'Highlight, comment, and mark up PDF pages.',
  category: 'edit',
  endpoint: '/tools/annotation',
}

export { AnnotationTool } from './components/AnnotationTool'
