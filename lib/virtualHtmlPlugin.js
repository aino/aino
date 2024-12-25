import fs from 'fs'
import { resolve } from 'path'
import { PAGES_DIR } from './index'
import compileTemplate from './compileTemplate'
import { getPageContext } from './getPageContext.js'
import { locales } from '../data.config.js'

export const getLangFromUrl = (url) => {
  const langMatch = url.match(
    new RegExp(`^/(${locales.slice(1).join('|')})(/|$)`)
  )
  return langMatch?.[1] || locales[0]
}

const getTemplateContext = async (url) => {
  const pageContext = await getPageContext(url)
  if (!pageContext) {
    return null
  }
  const { key, slug, data } = pageContext
  const templatePath = resolve(
    __dirname,
    '..',
    PAGES_DIR,
    key.replace(/^\//, ''),
    'index.html'
  )
  let template
  if (slug && /\[slug\]/.test(key)) {
    const templatePathWithSlug = templatePath.replace('[slug]', slug)
    if (fs.existsSync(templatePathWithSlug)) {
      template = fs.readFileSync(templatePathWithSlug, 'utf-8')
    }
  }
  if (!template && fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8')
  }
  if (!template) {
    return null
  }
  return { template, data }
}

const getLocalized404 = (url) => {
  const lang = getLangFromUrl(url)
  return lang === locales[0] ? `/${lang}/404/` : '/404/'
}

export default function virtualHtmlPlugin() {
  return {
    name: 'virtual-html',
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const acceptHeader = req.headers['accept']
          if (!acceptHeader || !acceptHeader.includes('text/html')) {
            return next()
          }
          let templateContext = await getTemplateContext(req.url)
          if (!templateContext) {
            templateContext = await getTemplateContext(getLocalized404(req.url))
            if (!templateContext) {
              return next()
            } else {
              const lang = getLangFromUrl(req.url)
              const langPath = lang === locales[0] ? '' : `/${lang}`
              const custom404Path = resolve(
                __dirname,
                `../dist${langPath}/404/index.html`
              )
              const custom404Content = fs.readFileSync(custom404Path, 'utf-8')
              res.writeHead(404, { 'Content-Type': 'text/html' })
              return res.end(custom404Content)
            }
          }
          return next()
        } catch (err) {
          console.error(err)
          next()
        }
      })
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const acceptHeader = req.headers['accept']
          if (!acceptHeader || !acceptHeader.includes('text/html')) {
            return next()
          }
          let templateContext = await getTemplateContext(req.url)
          if (!templateContext) {
            templateContext = await getTemplateContext(getLocalized404(req.url))
            if (!templateContext) {
              return next()
            }
          }
          const { template, data } = templateContext
          let html = await compileTemplate(template, data)
          html = await server.transformIndexHtml(req.url, html)
          res.setHeader('Content-Type', 'text/html')
          res.end(html)
        } catch (err) {
          console.error(err)
          next()
        }
      })
    },
  }
}
