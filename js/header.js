import { create, id, q } from './utils/dom'
import site, { toggleTextMode } from './stores/site'
import fadein from './fadein'

export default async function header() {
  const nav = id('nav')
  const [about] = q('.about', nav)
  setTimeout(() => {
    fadein(nav, {
      duration: 1200,
      speed: 10,
    })
  }, 200)
  const toggler = create(
    'button',
    {
      textContent: site.value.textMode ? 'Image mode' : 'Text mode',
      className: 'toggler ghost',
      onclick() {
        toggleTextMode()
      },
    },
    about
  )
  site.subscribe((newValue) => {
    toggler.textContent = newValue.textMode ? 'Image mode' : 'Text mode'
  })
}
