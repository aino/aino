import { q, update } from '../utils/dom'
import pixelate from '@/js/pixelate'
import ascii from '@/js/ascii'

export const path = /^\/work\/[^/]+$/

export default async function showcase(app) {
  const destroyers = []
  for (const img of q('img', app)) {
    ascii(img)
    pixelate(img)
  }
  return () => {
    for (const destroy of destroyers) {
      destroy()
    }
  }
}
