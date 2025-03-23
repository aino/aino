import { create, id, q } from './utils/dom'
import site, { toggleMode } from './stores/site'
import fadein from './fadein'
import { capitalize } from './utils/string'
import state from './utils/state'
import { parseLinks } from './white'
import * as detect from './utils/detect'
import wait from './utils/wait'

export default async function header() {
  const nav = id('nav')
  const [last] = q('.last', nav)
  const [mobile] = q('.mobile', nav)
  const destroyers = []
  const { default: nbtemplate } = await import('partials/newbusiness')
  let container
  const open = state(false, (isOpen) => {
    nav.classList.toggle('open', isOpen)
    mobile.innerText = isOpen ? 'Close' : 'Menu'
    if (isOpen) {
      const links = q('a:not(.home)', nav).map((a, i) => {
        const l = a.cloneNode(true)
        l.style.opacity = 0
        l.classList.add('mega')
        setTimeout(() => {
          l.style.opacity = 1
        }, i * 60)
        return l
      })
      container = create('div', { className: 'mobile-container' }, nav)
      const mnav = create('div', { className: 'mobile-nav text' })
      mnav.append(...links)
      container.appendChild(mnav)
      nav.after(container)
      parseLinks(container)
      const nb = create('div', { className: 'newbusiness' })
      nb.innerHTML = nbtemplate()
      container.appendChild(nb)
      fadein(nb)
    } else {
      container?.remove()
    }
  })
  const toggler = create('button', {
    textContent: `${capitalize(site.value.mode)} mode`,
    className: 'toggler ghost',
    onclick() {
      toggleMode()
    },
  })
  // last.prepend(toggler)
  site.subscribe((newValue) => {
    toggler.textContent = `${capitalize(newValue.mode)} mode`
  })
  if (!document.body.classList.contains('home')) {
    fadein(nav)
  }
  mobile.addEventListener('click', () => {
    open.set(!open.value)
  })
  const onHistoryState = () => {
    setTimeout(() => {
      open.set(false)
    }, 50)
  }
  addEventListener('historychange', onHistoryState)
  destroyers.push(() => removeEventListener('historychange', onHistoryState))

  return () => {
    destroyers.forEach((destroy) => destroy())
  }
}
