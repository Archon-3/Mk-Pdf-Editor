import { Link, useParams } from 'react-router-dom'
import { getToolById } from '../../features/pdf-tools'
import { EditorLayout } from '../../shared/components/editor'
import { absoluteUrl, getToolSeo, SeoHead, SITE_NAME } from '../../shared/seo'
import '../../styles/editor.css'

export function ToolPage() {
  const { toolId = '' } = useParams()
  const tool = getToolById(toolId)
  const seo = getToolSeo(toolId)

  if (!tool) {
    return (
      <section className="tool-workspace content-page">
        <SeoHead
          title={`Tool not found | ${SITE_NAME}`}
          description="The requested PDF tool does not exist."
          path={`/tools/${toolId}`}
          noIndex
        />
        <h1>Tool not found</h1>
        <p>The requested PDF tool does not exist.</p>
        <p><Link to="/tools">Open tools workspace</Link></p>
      </section>
    )
  }

  const title = seo?.title || `${tool.name} | ${SITE_NAME}`
  const description = seo?.description || tool.description
  const path = seo?.path || `/tools/${tool.id}`
  const keywords = seo?.keywords || [tool.name, 'pdf tool online', SITE_NAME]

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: seo?.h1 || tool.name,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web Browser (Chrome, Edge, Firefox, Safari)',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      description,
      url: absoluteUrl(path),
      provider: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: absoluteUrl('/'),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: 'Tools', item: absoluteUrl('/tools') },
        { '@type': 'ListItem', position: 3, name: seo?.h1 || tool.name, item: absoluteUrl(path) },
      ],
    },
  ]

  return (
    <div className="tools-editor-page">
      <SeoHead
        title={title}
        description={description}
        path={path}
        keywords={keywords}
        jsonLd={jsonLd}
      />
      {/* Crawlable headings without changing the workspace UI */}
      <h1 className="seo-only">{seo?.h1 || tool.name}</h1>
      <p className="seo-only">{description}</p>
      <EditorLayout initialToolId={tool.id} />
    </div>
  )
}
