import { locales } from '../data.config'

export default function localizedHrefPlugin() {
  return {
    name: 'vite-plugin-localized-href',
    enforce: 'post',
    transformIndexHtml(html, { filename }) {
      const localeRegex = new RegExp(`/(${locales.slice(1).join('|')})(/|$)`)
      const localeMatch = filename.match(localeRegex)
      const locale = localeMatch ? `/${localeMatch[1]}` : ''

      const skipRegex = /^(https?:\/\/|mailto:|#|\/assets)/

      return html.replace(
        /(<a\b[^>]*\shref)="([^"#][^"]*)"/g,
        (match, attr, value) => {
          if (skipRegex.test(value) || value.startsWith(locale)) {
            return match
          }

          // Add locale prefix if applicable
          return `${attr}="${locale}${value === '/' ? '' : value}"`
        }
      )
    },
  }
}
