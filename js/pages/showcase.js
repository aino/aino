import { q, create, observe, getCssVariable, getStyle } from '../utils/dom'
import fadein from '@/js/fadein'
import site from '@/js/stores/site'
import { fitHeight } from './global'
import pixelate from '../pixelate'
import wait from '../utils/wait'

export const path = /^\/work\/[^/]+$/

export default async function showcase(app) {
  const destroyers = []
  for (const d of q('.link, .services li, .technologies li', app)) {
    fadein(d)
  }

  const [worktable] = q('.worktable', app)
  destroyers.push(
    observe(
      worktable,
      () => {
        fadein(worktable, { speed: 1 })
      },
      null,
      {
        threshold: 0.2,
        once: true,
      }
    )
  )

  const [firstImage] = q('.image img', app)
  const makePixels = async () => {}
  makePixels()

  const [reel] = q('.reel', app)
  if (reel) {
    reel.addEventListener('click', (e) => {
      e.preventDefault()
      const frame = create(
        'div',
        {
          class: 'videoframe',
        },
        app
      )
      const wrapper = create(
        'div',
        {
          class: 'wrapper',
        },
        frame
      )
      create(
        'video',
        {
          autoplay: true,
          controls: false,
          loop: true,
          src: reel.href,
        },
        wrapper
      )
      const close = create(
        'button',
        {
          class: 'close ghost',
          textContent: 'X',
        },
        frame
      )
      close.addEventListener('click', () => {
        frame.remove()
      })
      const onKeyDown = (e) => {
        if (e.key === 'Escape') {
          frame.remove()
          removeEventListener('keydown', onKeyDown)
        }
      }
      addEventListener('keydown', onKeyDown)
      return false
    })
  }

  return () => {
    document.documentElement.classList.remove('dark')
    for (const destroy of destroyers) {
      destroy()
    }
  }
}
