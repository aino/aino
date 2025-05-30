import { q } from '@/js/utils/dom'
import grid from '../grid/grid3'
import { lerp } from '@/js/utils/animate'
import { getStyle } from '../utils/dom'
import fadein from '@/js/fadein'
import admin from '../admin/admin'

export const path = /^\/contact\/?$/

export default async function contact(app) {
  const [bouncer] = q('.bounce', app)
  const [info] = q('.info', app)
  const destroyers = []

  destroyers.push(await admin(app, 'pages'))

  info && fadein(info)

  if (bouncer) {
    const parent = bouncer.parentElement
    const onResize = () => {
      const marginTop = getStyle(info, 'margin-top')
      bouncer.style.height = marginTop
    }
    new ResizeObserver(onResize).observe(parent)
    onResize()
    const { createText, listen, render, applyPhysics, gravitate, destroy } =
      grid(bouncer)
    const text = createText({
      text: 'Contact',
      col: 0,
      row: 0,
    })
    for (const point of text) {
      point.x = Math.random()
      point.vx = lerp(-0.5, 0.5, Math.random())
      point.vy -= lerp(0, 0.05, Math.random())
    }
    listen('frame', ({ delta }) => {
      applyPhysics(text, delta)
      render(text)
    })
    gravitate(text, {
      damping: 1.01,
    })
  } else {
    console.warn('No bouncer found')
  }
  return () => {
    destroyers.forEach((destroy) => destroy())
  }
}
