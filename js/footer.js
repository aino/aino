import { id, q } from '@/js/utils/dom'
import grid from '@/js/grid/grid2'
import loadimage from '@/js/utils/loadimage'
import { create, getCssVariable, resize } from './utils/dom'
import { fitHeight } from './pages/global'

export default async function footer() {
  const footer = id('footer')
  const [logo] = q('.logo', footer)
  const svg = await loadimage('/aino-agency.svg')
  const ratio = svg.width / svg.height
  const setLogoSize = () => {
    const { width } = logo.getBoundingClientRect()
    let height = width / ratio
    const ch = getCssVariable('ch')
    const rows = Math.ceil(height / ch) + 1
    const newHeightInRem = Math.floor(rows / 2) * 2
    logo.style.height = `${newHeightInRem * ch}px`
  }
  setLogoSize()

  const { render, paintCanvas, createFromCanvas, listen, canvas } = grid(logo)

  const draw = () => {
    paintCanvas(svg, { alpha: 0.5, x: 0 })
    render(createFromCanvas({ context: 'logo' }))
  }
  document.body.appendChild(canvas)

  listen('resize', () => {
    setLogoSize()
    draw()
  })
  draw()
}
