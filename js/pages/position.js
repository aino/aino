import admin from '../admin/admin'
import { q } from '@/js/utils/dom'

export const path = /^\/careers\/[^/]+$/

export default async function position(app) {
  const destroyers = []
  const [titleNode] = q('.data-title', app)
  const [subtitleNode] = q('.data-subtitle', app)

  destroyers.push(
    await admin(app, 'positions', (data) => {
      titleNode.textContent = data.title
      subtitleNode.textContent = data.subtitle
    })
  )
  return () => {
    destroyers.forEach((destroy) => destroy())
  }
}
