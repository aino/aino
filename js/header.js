import { create, q } from './utils/dom'
import site, { toggleTextMode } from './stores/site'

export default function header() {
  const [about] = q('#nav .about')
  console.log(site.value)
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
