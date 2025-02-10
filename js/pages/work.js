import workData from '@/data/work'
import grid from '@/js/grid/grid2'
import { q, style } from '../utils/dom'
import wait from '../utils/wait'
import { clone } from '../utils/object'

export const path = /^\/work$/

export default async function about(app) {
  return
  const [table] = q('.table')
  table.style.height = '100vh'
  const disabled = table.cloneNode(true)
  style(disabled, {
    position: 'absolute',
    opacity: 0.2,
    width: '100vw',
    top: '6rem',
  })
  table.parentNode.appendChild(disabled)

  const {
    createText,
    startRenderLoop,
    gravitate,
    morph,
    dimensions,
    explode,
    render,
    randomize,
  } = grid(table)

  const disabledGrid = grid(disabled)

  let row = 0
  const start = []
  const nolink = []

  for (const data of workData) {
    if (data.slug) {
      start.push(
        ...createText({
          text: data.name,
          row,
          col: 0,
        })
      )
    } else {
      nolink.push(
        ...disabledGrid.createText({
          text: data.name,
          row,
          col: 0,
        })
      )
    }
    row++
  }
  const main = createText({
    text: 'Work',
    row: 0,
    col: 5,
  })
  gravitate(main)
  startRenderLoop(main)
  // disabledGrid.render(nolink)
  await wait(1000)
  morph(main, start)
}
