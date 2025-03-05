import { id, q } from '@/js/utils/dom'
import grid from '@/js/grid/grid2'
import loadimage from '@/js/utils/loadimage'
import { create } from './utils/dom'

export default async function footer() {
  const footer = id('footer')
  const [logo] = q('.logo', footer)
  const svg = await loadimage('/aino-agency.svg')
  const ratio = svg.width / svg.height
  logo.style.paddingBottom = `${100 / ratio}%`
  const { render, paintCanvas, createFromCanvas, listen, dimensions } =
    grid(logo)

  const draw = () => {
    paintCanvas(svg, { alpha: 0.5, x: 0 })
    render(createFromCanvas({ context: 'logo' }))
  }

  listen('resize', draw)
  draw()
}
