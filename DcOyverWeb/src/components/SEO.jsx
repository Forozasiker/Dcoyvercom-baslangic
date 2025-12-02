import { useEffect } from 'react'

export default function SEO({ title, description, keywords, image, url, type = 'website' }) {
  useEffect(() => {
    // Update title
    if (title) {
      document.title = title
    }

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.setAttribute('name', 'description')
      document.head.appendChild(metaDescription)
    }
    if (description) {
      metaDescription.setAttribute('content', description)
    }

    // Update meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]')
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta')
      metaKeywords.setAttribute('name', 'keywords')
      document.head.appendChild(metaKeywords)
    }
    if (keywords) {
      metaKeywords.setAttribute('content', keywords)
    }

    // Helper function to update or create meta tags
    const updateMeta = (selector, attribute, value, defaultValue = null) => {
      let meta = document.querySelector(selector)
      if (!meta) {
        meta = document.createElement('meta')
        if (selector.includes('[property=')) {
          meta.setAttribute('property', attribute)
        } else if (selector.includes('[name=')) {
          meta.setAttribute('name', attribute)
        }
        document.head.appendChild(meta)
      }
      if (value || defaultValue) {
        meta.setAttribute('content', value || defaultValue)
      }
    }

    // Update Open Graph
    if (title) updateMeta('meta[property="og:title"]', 'og:title', title)
    if (description) updateMeta('meta[property="og:description"]', 'og:description', description)
    if (url) updateMeta('meta[property="og:url"]', 'og:url', url)
    if (image) {
      updateMeta('meta[property="og:image"]', 'og:image', image)
      updateMeta('meta[property="og:image:width"]', 'og:image:width', '1200')
      updateMeta('meta[property="og:image:height"]', 'og:image:height', '630')
    }
    updateMeta('meta[property="og:type"]', 'og:type', type, 'website')
    updateMeta('meta[property="og:site_name"]', 'og:site_name', 'DcOyver.com')

    // Update Twitter
    if (title) updateMeta('meta[name="twitter:title"]', 'twitter:title', title)
    if (description) updateMeta('meta[name="twitter:description"]', 'twitter:description', description)
    if (image) {
      updateMeta('meta[name="twitter:image"]', 'twitter:image', image)
      updateMeta('meta[name="twitter:image:alt"]', 'twitter:image:alt', title || 'DcOyver.com')
    }
    updateMeta('meta[name="twitter:card"]', 'twitter:card', 'summary_large_image')

    // Update canonical
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    if (url) {
      canonical.setAttribute('href', url)
    }

    // Update hreflang for multilingual support
    const updateHreflang = (lang, href) => {
      let link = document.querySelector(`link[rel="alternate"][hreflang="${lang}"]`)
      if (!link) {
        link = document.createElement('link')
        link.setAttribute('rel', 'alternate')
        link.setAttribute('hreflang', lang)
        document.head.appendChild(link)
      }
      link.setAttribute('href', href)
    }

    if (url) {
      updateHreflang('tr', url)
      updateHreflang('en', url)
      updateHreflang('x-default', url)
    }
  }, [title, description, keywords, image, url, type])

  return null
}

