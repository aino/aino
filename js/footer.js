import { id, q } from '@/js/utils/dom'
import grid from '@/js/grid/grid3'
import loadimage from '@/js/utils/loadimage'
import { getCssVariable } from './utils/dom'
import dateformat from 'dateformat'
import hoverchar from './hoverchar'

const getTime = () => dateformat(new Date(), 'dddd HH:MM:ss')

export default async function footer() {
  const destroyers = []
  const footer = id('footer')
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
  destroyers.push(clearTimeout(timer.current))
  return () => {
    destroyers.forEach((destroy) => destroy())
  }
}
