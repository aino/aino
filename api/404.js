import { readFileSync } from 'fs'
import { join } from 'path'
import { locales } from '../data.config.js'

export default function handler(req, res) {
  const lang = req.url.match(
    new RegExp(`^/(${locales.slice(1).join('|')})(/|$)`)
  )?.[1]
  const filePath = join(process.cwd(), 'dist', lang, '404', 'index.html')

  try {
    // Read the static file content
    const fileContent = readFileSync(filePath, 'utf-8')

    // Set the response headers and serve the 404 page
    res.status(404).setHeader('Content-Type', 'text/html').send(fileContent)
  } catch (error) {
    console.error('Error serving 404 page:', error)
    res.status(404).send('Not found')
  }
}
