import { useEffect } from 'react'
import { absoluteUrl, SITE_NAME, type SeoPayload } from './catalog'

type SeoHeadProps = SeoPayload & {
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  if (typeof document === 'undefined') return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

function upsertLink(rel: string, href: string) {
  if (typeof document === 'undefined') return
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}

function upsertJsonLd(id: string, data: Record<string, unknown> | Record<string, unknown>[]) {
  if (typeof document === 'undefined') return
  let el = document.getElementById(id) as HTMLScriptElement | null
  if (!el) {
    el = document.createElement('script')
    el.type = 'application/ld+json'
    el.id = id
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

/** Updates document title + meta tags for SPA routes (Google/Bing/Edge/Firefox discovery). */
export function SeoHead({
  title,
  description,
  path,
  keywords = [],
  type = 'website',
  noIndex = false,
  jsonLd,
}: SeoHeadProps) {
  useEffect(() => {
    const url = absoluteUrl(path)
    document.title = title
    upsertMeta('name', 'description', description)
    upsertMeta('name', 'keywords', keywords.join(', '))
    upsertMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large')
    upsertMeta('name', 'googlebot', noIndex ? 'noindex, nofollow' : 'index, follow')
    upsertMeta('name', 'bingbot', noIndex ? 'noindex, nofollow' : 'index, follow')
    upsertMeta('property', 'og:site_name', SITE_NAME)
    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:type', type)
    upsertMeta('property', 'og:url', url)
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', title)
    upsertMeta('name', 'twitter:description', description)
    upsertLink('canonical', url)

    if (jsonLd) upsertJsonLd('mk-seo-jsonld', jsonLd)
  }, [title, description, path, keywords, type, noIndex, jsonLd])

  return null
}
