import pixelate from '@/js/pixelate'
import { q, id } from '@/js/utils/dom'
import grid from '../grid/grid2'
import loadimage from '@/js/utils/loadimage'

export const path = /.*/

export default async function global(app) {
  for (const img of q('.image img')) {
    console.log('Pixelating', img)
    // const draw = pixelate(img)
    // draw()
  }
  const footer = id('footer')
  const [logo] = q('.logo', footer)
  const svg = await loadimage('/aino-agency.svg')
  const ratio = svg.width / svg.height
  logo.style.paddingBottom = `${100 / ratio}%`
  const { render, canvas, createFromCanvas } = grid(logo)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.globalAlpha = 0.06
  let scale = Math.min(canvas.width / svg.width, canvas.height / svg.height)
  const logoWidth = svg.width * scale
  const logoHeight = svg.height * scale * 0.5
  ctx.drawImage(svg, 0, 0, logoWidth * 2.03, logoHeight * 2.03)
  render(
    createFromCanvas({
      context: 'logo',
    })
  )
  document.body.appendChild(canvas)
}
