import { q, update } from '../utils/dom'
import pixelate from '@/js/pixelate'
import ascii from '@/js/ascii'
import fadein from '@/js/fadein'

export const path = /^\/work\/[^/]+$/

export default async function showcase(app) {
  const destroyers = []
  for (const img of q('img', app)) {
    // ascii(img)
    // pixelate(img)
  }
  for (const d of q('.position, .link, .services li, .technologies li', app)) {
    fadein(d)
  }
  const [intro] = q('.intro', app)
  intro.classList.add('in')

  /*

  function showMeta() {
    if (scrollY > 20) {
      for (const d of q(
        '.technologies li:not(:first-child), .services li:not(:first-child)',
        app
      )) {
        fadein(d)
      }
      removeEventListener('scroll', showMeta)
    }
  }

  addEventListener('scroll', showMeta)

  */

  return () => {
    for (const destroy of destroyers) {
      destroy()
    }
  }
}
