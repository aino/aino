import * as config from '../data.config.js'
import { resolve } from 'path'
import { PAGES_DIR } from './index'
import fs from 'fs'

export async function getPageContext(url, prefetched) {
  const { locales, globalData, routes } = config

  // Remove leading/trailing slashes and normalize path
  const path = url.replace(/^\/|\/?\w+\.html$|\/$/g, '').trim()

  // Split the path into segments
  const segments = path.split('/').filter(Boolean)

  // Determine the language from the first segment
  let lang = locales[0] // Default language
  if (locales.includes(segments[0])) {
    lang = segments.shift()
  }

  // Resolve global data
  const globals = globalData ? await globalData(prefetched) : {}

  // Find the matching page or route
  let key = `/${segments.join('/')}`

  let page = routes[key]
  let data = {
    ...globals,
    lang,
  }
  let slug = null

  // Handle dynamic routes
  if (!page) {
    slug = segments.pop()
    key = `/${segments.concat('[slug]').join('/')}`
    page = routes[key]
    const getStaticTemplate = () => {
      const templatePath = resolve(
        __dirname,
        '..',
        PAGES_DIR,
        segments.join('/'),
        'index.html'
      )
      if (fs.existsSync(templatePath)) {
        return { key, slug, data }
      }
    }
    if (page && page?.slugs) {
      const slugs = await page.slugs(prefetched)
      if (!slugs.includes(slug)) {
        return getStaticTemplate() || null // Invalid slug
      }
      if (page?.data) {
        Object.assign(data, await page.data({ slug, lang, prefetched }))
      }
      return { key, slug, data }
    } else {
      // Handle static templates without data
      return getStaticTemplate() || null
    }
  }
  if (page?.data) {
    Object.assign(data, await page.data({ lang, prefetched }))
  }
  return { key, slug, data }
}
