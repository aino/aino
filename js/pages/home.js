import '@/styles/pages/home.css'
import grid from '@/js/grid/grid'
import { q, resize } from '@/js/utils/dom'

export const path = /^\/$/

export default async function home(app) {
  const [gridNode] = q('.grid')
  const { setText, update, setFormattedParagraph, points, rows } =
    grid(gridNode)
  let raf
  const loop = () => {
    update()
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)
  setText({
    row: 20,
    col: 10,
    value: 'Hello world David Hellsing',
    fixed: true,
  })

  setText({
    row: 0,
    col: 8,
    value:
      'Hello world David Hellsing Hello world David Hellsing Hello world David Hellsing Hello world David Hellsing',
  })
  return () => {
    if (raf) {
      cancelAnimationFrame(raf)
    }
  }
}
