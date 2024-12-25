import * as config from '../data.config.js'
import { memo } from '../js/utils/memo.js'
import { resolve } from 'path'
import { PAGES_DIR } from './index'
import fs from 'fs'

export async function getPageContext(url) {
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
  const globals = globalData ? await globalData() : {}

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
    if (page && page?.slugs) {
      const slugs = await memo(() => page.slugs())
      if (!slugs.includes(slug)) {
        return null // Invalid slug
      }
      if (page?.data) {
        Object.assign(data, await page.data({ slug, lang }))
      }
      return { key, slug, data }
    } else {
      // Handle static templates without data
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
      return null
    }
  }
  if (page?.data) {
    Object.assign(data, await page.data({ lang }))
  }
  return { key, slug, data }
}
