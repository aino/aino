import { id, q } from '@/js/utils/dom'
import grid from '@/js/grid/grid2'
import loadimage from '@/js/utils/loadimage'

export default async function footer() {
  const footer = id('footer')
  const [logo] = q('.logo', footer)
  const svg = await loadimage('/aino-agency.svg')
  const ratio = svg.width / svg.height
  logo.style.paddingBottom = `${100 / ratio}%`
  const { render, canvas, createFromCanvas } = grid(logo)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.globalAlpha = 0.4
  let scale = Math.min(canvas.width / svg.width, canvas.height / svg.height)
  const logoWidth = svg.width * scale
  const logoHeight = svg.height * scale * 0.5
  ctx.drawImage(svg, 0, 0, logoWidth * 1.9, logoHeight * 1.9)
  render(
    createFromCanvas({
      context: 'logo',
    })
  )
}
