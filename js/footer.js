import { id, q } from '@/js/utils/dom'
import grid from '@/js/grid/grid3'
import loadimage from '@/js/utils/loadimage'
import { getCssVariable } from './utils/dom'
import dateformat from 'dateformat'
import hoverchar from './hoverchar'

const getTime = () => dateformat(new Date(), 'dddd HH:MM:ss')

export default async function footer() {
  if (document.body.classList.contains('home')) {
    return
  }
  const destroyers = []
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

  const { render, paintCanvas, createFromCanvas, listen, createCanvas } =
    grid(logo)

  const canvas = createCanvas()
  const draw = () => {
    paintCanvas(canvas, svg, { alpha: 0.02, x: 0 })
    render(createFromCanvas({ context: 'logo' }))
  }
  // document.body.appendChild(canvas)

  listen('resize', () => {
    setLogoSize()
    draw()
  })
  draw()
  const [shortcuts] = q('.shortcuts', footer)
  const [time] = q('.time', shortcuts)

  let timer
  const tick = () => {
    time.innerText = getTime()
    clearTimeout(timer)
    timer = setTimeout(() => {
      setTimeout(tick, 50)
    }, 50)
  }
  tick()
  hoverchar(footer)
  destroyers.push(clearTimeout(timer.current))
  return () => {
    destroyers.forEach((destroy) => destroy())
  }
}
