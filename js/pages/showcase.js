import { q, create, observe, getCssVariable, getStyle } from '../utils/dom'
import fadein from '@/js/fadein'
import site from '@/js/stores/site'
import { fitHeight } from './global'

export const path = /^\/work\/[^/]+$/

export default async function showcase(app) {
  const destroyers = []
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
  const [worktitle] = q('.worktitle', intro)
  if (worktitle) {
    const clone = worktitle.cloneNode(true)
    worktitle.before(clone)
    clone.classList.add('clone')
    const round = (n) => {
      const ch = getCssVariable('ch')
      return Math.round(n / (ch * 2)) * ch * 2
    }
    const onScroll = () => {
      if (document.documentElement.classList.contains('textmode')) {
        const ch = getCssVariable('ch')
        const top = round(parseFloat(getStyle(worktitle, 'top'))) - ch * 2
        const maxDistance = round(intro.offsetHeight) - top
        const distance = Math.min(maxDistance, round(scrollY))
        clone.style.transform = `translateY(${distance}px)`
        worktitle.style.transform = `translateY(${distance}px)`
      }
    }
    addEventListener('scroll', onScroll)
    destroyers.push(() => removeEventListener('scroll', onScroll))
  }

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

  destroyers.push(
    site.subscribe((newValue) => {
      if (newValue.textMode) {
        fitHeight(intro)
      } else {
        intro.style.height = ''
      }
    })
  )

  const observer = new ResizeObserver(() => {
    if (site.value.textMode) {
      fitHeight(intro)
    }
  })
  observer.observe(intro)

  destroyers.push(() => observer.disconnect())

  if (site.value.textMode) {
    fitHeight(intro)
  }

  const [reel] = q('.worktitle:not(.clone) .reel', app)
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
