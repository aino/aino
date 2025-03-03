import { q, id, style, create, getCssVariable } from '@/js/utils/dom'
import grid from '../grid/grid2'
import loadimage from '@/js/utils/loadimage'
import hoverchar from '@/js/hoverchar'
import gridoverlay from '../gridoverlay'
import { observe } from '../utils/dom'
import fadein from '../fadein'

export const path = /.*/

export default async function global(app) {
  const destroyers = []
  for (const imageSection of q('section .image')) {
    const [img] = q('img', imageSection)
    const fitHeight = () => {
      imageSection.style.height = ''
      const rem = getCssVariable('ch')
      const { height } = imageSection.getBoundingClientRect()
      const rows = Math.floor(height / rem)
      const newHeightInRem = Math.floor(rows / 2) * 2
      imageSection.style.height = `${newHeightInRem * rem}px`
    }
    if (img.complete) {
      fitHeight()
    } else {
      img.onload = () => fitHeight()
    }
    const observer = new ResizeObserver(() => fitHeight())
    observer.observe(img)
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

  hoverchar()
  for (const fader of q('.fadein')) {
    destroyers.push(
      observe(
        fader,
        () => {
          fadein(fader, null, null, 1)
        },
        null,
        {
          threshold: 0.2,
          once: true,
        }
      )
    )
  }

  return () => {
    for (const destroy of destroyers) {
      destroy()
    }
  }
}
