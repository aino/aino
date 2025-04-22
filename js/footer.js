import { id, q } from '@/js/utils/dom'
import grid from '@/js/grid/grid3'
import loadimage from '@/js/utils/loadimage'
import { create, getCssVariable } from './utils/dom'
import dateformat from 'dateformat'
import hoverchar from './hoverchar'
import site from '@/js/stores/site'

const getTime = () => dateformat(new Date(), 'dddd HH:MM:ss')

export default async function footer() {
  const destroyers = []
  const footer = id('footer')
  const [shortcuts] = q('.shortcuts', footer)
  const [time] = q('.time', shortcuts)
  const [loc] = q('.location', shortcuts)

  let timer
  const tick = () => {
    time.innerText = getTime()
    clearTimeout(timer)
    timer = setTimeout(() => {
      setTimeout(tick, 200)
    }, 200)
  }
  tick()
  site.subscribe((newValue) => {
    if (newValue.session) {
      const btn = create('button', {
        innerHTML: '&nbsp;Logout',
        className: 'ghost',
      })
      btn.addEventListener('click', async () => {
        const response = await fetch('/api/logout', {
          method: 'POST',
        })
        if (response.ok) {
          site.assign({ session: null })
        } else {
          alert('Logout failed')
        }
      })
      loc.appendChild(btn)
    } else {
      loc.innerHTML = 'GBG/OSL'
    }
  })
  destroyers.push(clearTimeout(timer.current))
  return () => {
    destroyers.forEach((destroy) => destroy())
  }
}
