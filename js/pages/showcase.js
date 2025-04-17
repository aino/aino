import { q, create, observe, getRenderData } from '../utils/dom'
import fadein from '@/js/fadein'
import pixelate from '../pixelate'
import ascii from '../ascii'
import site from '@/js/stores/site'

export const path = /^\/work\/[^/]+$/

export default async function showcase(app) {
  const destroyers = []
  const [sections] = q('.sections', app)
  let data = getRenderData(sections)

  let imageDestroyers = []
  const resetImages = () => {
    for (const destroy of imageDestroyers) {
      destroy()
    }
    imageDestroyers = []
  }

  const parseMedia = () => {
    const mode = site.value.mode
    resetImages()
    for (const source of q('img, video', app)) {
      if (mode === 'text') {
        imageDestroyers.push(ascii(source))
      } else if (mode === 'pixel') {
        imageDestroyers.push(pixelate(source))
      }
    }
  }

  destroyers.push(
    site.subscribe((newValue, oldValue) => {
      if (newValue.mode !== oldValue.mode) {
        parseMedia()
      }
    })
  )

  const { default: columns } = await import('partials/columns')
  const render = () => {
    let html = ''
    for (const section of data) {
      html += `<section class="${section.className}">${columns(
        section.columns
      )}</section>`
    }
    sections.innerHTML = html
    parseMedia()
  }
  render()

  const admin = create('div', { id: 'admin' })
  sections.before(admin)

  const setData = (newData) => {
    data = newData
    render()
  }

  console.log('secgtions', sections)

  Promise.all([
    import('react'),
    import('react-dom/client'),
    import('../admin/App'),
  ]).then(([React, ReactDOM, AdminApp]) => {
    ReactDOM.createRoot(admin).render(
      React.createElement(AdminApp.default, {
        data,
        setData,
        sections,
      })
    )
  })

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
    for (const destroy of [...destroyers, ...imageDestroyers]) {
      destroy()
    }
  }
}
