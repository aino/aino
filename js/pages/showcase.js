import { q, update, create, observe } from '../utils/dom'
import pixelate from '@/js/pixelate'
import ascii from '@/js/ascii'
import fadein from '@/js/fadein'
import hoverchar from '../hoverchar'

export const path = /^\/work\/[^/]+$/

export default async function showcase(app) {
  const destroyers = []
  for (const img of q('img', app)) {
    // ascii(img)
    // pixelate(img)
  }
  for (const d of q(
    '.position, .link, .services li:first-child, .technologies li:first-child',
    app
  )) {
    fadein(d)
  }

  const [intro] = q('.intro', app)
  intro.classList.add('in')

  const [meta] = q('.meta', app)
  destroyers.push(
    observe(
      meta,
      () => {
        for (const d of q(
          '.technologies li:not(:first-child), .services li:not(:first-child)',
          app
        )) {
          fadein(d)
        }
      },
      null,
      {
        threshold: 1,
        once: true,
      }
    )
  )

  const [worktable] = q('.worktable', app)
  destroyers.push(
    observe(
      worktable,
      () => {
        fadein(worktable, null, null, 1)
      },
      null,
      {
        threshold: 0.2,
        once: true,
      }
    )
  )

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
    for (const destroy of destroyers) {
      destroy()
    }
  }
}
