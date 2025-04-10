import { create, style, q } from '@/js/utils/dom'
import fadeout from '@/js/fadeout'
import fadein from '@/js/fadein'
import { stopHoverChar } from '../hoverchar'
import { smoothScroll } from '../utils/scroll'
import site from '@/js/stores/site'
import wait from '@/js/utils/wait'
import animate, { lerp } from '../utils/animate'
import { getCssVariable } from '../utils/dom'

export const path = /^\/work$/

export default async function about(app) {
  const destroyers = []
  const [worktable] = q('.worktable', app)
  const lines = q('.line', worktable)
  const renderLines = async () => {
    for (const line of lines) {
      line.style.display = 'grid'
      await wait(30)
    }
  }
  renderLines()
  const items = q('li', worktable)

  for (let i = 0; i < items.length; i++) {
    const [a] = q('a', items[i])
    if (a) {
      a.dataset.preventclick = 'true'
      a.addEventListener('click', async (e) => {
        e.preventDefault()
        stopHoverChar()
        const li = e.target.closest('li')
        li.classList.add('active')
        li.parentElement.classList.add('out')
        await wait(200)
        history.pushState(null, '', a.href)
      })
    }
  }
  return () => {
    destroyers.forEach((destroy) => destroy())
  }
}
