import { create, id, q } from './utils/dom'
import site, { toggleMode } from './stores/site'
import fadein from './fadein'
import { capitalize } from './utils/string'

export default async function header() {
  const nav = id('nav')
  const [about] = q('.about', nav)

  const toggler = create(
    'button',
    {
      textContent: `${capitalize(site.value.mode)} mode`,
      className: 'toggler ghost',
      onclick() {
        toggleMode()
      },
    },
    about
  )
  site.subscribe((newValue) => {
    toggler.textContent = `${capitalize(newValue.mode)} mode`
  })
  if (document.body.classList.contains('home')) {
    setTimeout(() => {
      fadein(nav, {
        duration: 1200,
        speed: 10,
      })
    }, 200)
  } else {
    fadein(nav)
  }
}
