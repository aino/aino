import { create } from './utils/dom'
import site, { modes, themes } from './stores/site'
import { capitalize } from './utils/string'

export default function settings() {
  const container = create('div', {
    className: 'settings',
  })
  const renderList = (items, name) => {
    return items
      .map(
        (item) =>
          `<li class="${
            item === site.value[name] ? 'active' : ''
          }"><button class="ghost" data-${name}="${item}">${capitalize(
            item
          )}</button></li>`
      )
      .join('')
  }
  const render = () => {
    container.innerHTML = `
      <ul class="appearance">
        ${renderList(['dark', 'light'], 'appearance')}
      </ul>
      <ul class="modes">
        ${renderList(modes, 'mode')}
      </ul>
      ${
        site.value.mode === 'pixel'
          ? `<ul class="themes">
        ${renderList(Object.keys(themes), 'theme')}
        </ul>
      `
          : ''
      }`
  }
  const unlisten = site.subscribe(() => render())
  render()
  const onClick = (e) => {
    if (e.target.tagName === 'BUTTON') {
      const theme = e.target.dataset.theme
      const appearance = e.target.dataset.appearance
      const mode = e.target.dataset.mode
      if (mode) {
        site.assign({ mode })
      }
      if (theme) {
        site.assign({ theme })
      }
      if (appearance) {
        site.assign({ appearance })
      }
    }
  }
  container.addEventListener('click', onClick)
  return {
    container,
    destroy() {
      container.removeEventListener('click', onClick)
      unlisten()
    },
  }
}
