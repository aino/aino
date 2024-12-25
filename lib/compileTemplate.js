import Handlebars from 'handlebars'
import { minify } from 'html-minifier-terser'

export default async function compileTemplate(template, data) {
  const html = Handlebars.compile(template)(data)
  // Transform inlined JavaScript with Vite
  return await minify(html, {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeEmptyAttributes: true,
    minifyCSS: true,
    minifyJS: true,
  })
}
