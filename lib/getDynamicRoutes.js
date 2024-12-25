import { PAGES_DIR } from './index'
import { resolve } from 'path'
import { globSync } from 'glob'
import { routes, locales } from '../data.config'

const rSlug = /\[slug\]/

export default async function getDynamicRoutes() {
  const dynamicPaths = []
  const slugPromises = []
  const input = globSync(
    resolve(__dirname, '..', PAGES_DIR, '**/*.html')
  ).filter((path) => !path.includes('[slug]'))
  for (const [path, page] of Object.entries(routes)) {
    if (rSlug.test(path) && page.slugs) {
      const makeSlugs = async () => {
        const slugs = await page.slugs()
        for (const slug of slugs) {
          const key = path.replace(rSlug, slug)
          dynamicPaths.push(key)
          const file = resolve(
            __dirname,
            '..',
            PAGES_DIR,
            `${key.replace(/^\//, '')}/index.html`
          )
          if (!input.includes(file)) {
            input.push(file)
          }
        }
      }
      slugPromises.push(makeSlugs())
    }
  }
  // input.concat(localized)

  await Promise.all(slugPromises)
  const localized = []
  const root = resolve(__dirname, '..', PAGES_DIR)
  for (const lang of locales.slice(1)) {
    for (const path of input) {
      localized.push(path.replace(root, `${root}/${lang}`))
    }
  }
  input.push(...localized)

  return { input, dynamicPaths }
}
