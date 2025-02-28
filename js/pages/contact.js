import { q } from '@/js/utils/dom'
import grid from '../grid/grid2'
import { lerp } from '@/js/utils/animate'

export const path = /^\/contact\/?$/

export default async function contact(app) {
  const [bouncer] = q('.bounce', app)
  const { createText, startRenderLoop, render, explode, gravitate, listen } =
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
  const { update } = startRenderLoop()

  update(text)
  gravitate(text, {
    damping: 1.00002,
  })
}
