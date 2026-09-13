import { EditorLayout } from '../../shared/components/editor'
import { PDF_TOOLS } from '../../features/pdf-tools'
import { PAGE_SEO, SeoHead, SITE_URL, TOOL_SEO } from '../../shared/seo'
import '../../styles/editor.css'

/** Former tools workspace — SEO meta + JSON-LD still applied for discoverability. */
export function ToolsListPage() {
  const seo = PAGE_SEO.tools
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'MK PDF Editor tools',
    numberOfItems: PDF_TOOLS.length,
    itemListElement: PDF_TOOLS.map((tool, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: TOOL_SEO[tool.id]?.h1 || tool.name,
      url: `${SITE_URL}/tools/${tool.id}`,
      description: TOOL_SEO[tool.id]?.description || tool.description,
    })),
  }

  return (
    <div className="tools-editor-page">
      <SeoHead {...seo} keywords={seo.keywords} jsonLd={jsonLd} />
      <h1 className="seo-only">{seo.title}</h1>
      <p className="seo-only">{seo.description}</p>
      <EditorLayout />
    </div>
  )
}
