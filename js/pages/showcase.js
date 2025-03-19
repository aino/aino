import { q, create, observe } from '../utils/dom'
import fadein from '@/js/fadein'
import pixelate from '../pixelate'
import ascii from '../ascii'

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
      const video = create(
        'video',
        {
          autoplay: true,
          controls: false,
          loop: true,
          src: reel.href,
          muted: true,
          preload: 'auto',
        },
        wrapper
      )
      if (document.documentElement.classList.contains('textmode')) {
        destroyers.push(ascii(video))
      } else if (document.documentElement.classList.contains('pixelmode')) {
        destroyers.push(pixelate(video))
      }
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
    for (const destroy of destroyers) {
      destroy()
    }
  }
}
