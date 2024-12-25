import { q } from '../utils/dom'

export const path = /^\/work\/[^/]+$/

export default async function showcase(app) {
  const { default: template } = await import('partials/sections')
  const [sections] = q('.sections', app)
  const slug = location.pathname.split('/').filter(Boolean).pop()
  console.log('SLUG', slug)
  const response = await fetch(`/api/data?type=work&slug=${slug}`)
  const json = await response.json()
  console.log(json)
  const html = template({ sections: json.sections })
  console.log('html', html, sections)
  sections.innerHTML = html
}
