import { create, id, q } from './utils/dom'
import site, { toggleMode } from './stores/site'
import fadein from './fadein'
import { capitalize } from './utils/string'
import state from './utils/state'
import { parseLinks } from './white'

export default async function header() {
  const nav = id('nav')
  const [last] = q('.last', nav)
  const [mobile] = q('.mobile', nav)
  const destroyers = []
  let container
  const open = state(false, (isOpen) => {
    nav.classList.toggle('open', isOpen)
    if (isOpen) {
      const links = q('a:not(.home)', nav).map((a) => a.cloneNode(true))
      container = create('div', { className: 'mobile-container' }, nav)
      container.append(...links)
      nav.after(container)
      parseLinks(container)
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
  last.prepend(toggler)
  site.subscribe((newValue) => {
    toggler.textContent = `${capitalize(newValue.mode)} mode`
  })
  fadein(nav)
  mobile.addEventListener('click', () => {
    open.set(!open.value)
  })
  const onHistoryState = () => {
    requestAnimationFrame(() => {
      open.set(false)
    })
  }
  addEventListener('historychange', onHistoryState)
  destroyers.push(() => removeEventListener('historychange', onHistoryState))

  return () => {
    destroyers.forEach((destroy) => destroy())
  }
}
