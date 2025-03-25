import { q } from '@/js/utils/dom'
import hoverchar from '@/js/hoverchar'
import { observe } from '../utils/dom'
import fadein from '@/js/fadein'
import site from '@/js/stores/site'
import ascii from '../ascii'
import email from '../email'
import pixelate from '../pixelate'
import sidegallery from '../sidegallery'

export const path = /.*/

const html = document.documentElement

export default async function global(app) {
  const isHome = document.body.classList.contains('home')
  if (!isHome) {
    window._visited = true
  }
  const destroyers = []

  hoverchar()

  let imageDestroyers = []
  const resetImages = () => {
    for (const destroy of imageDestroyers) {
      destroy()
    }
    imageDestroyers = []
  }

  q('img').forEach((img) => {
    let retryCount = 0
    const maxRetries = 3
    img.addEventListener('error', () => {
      if (retryCount >= maxRetries) {
        console.error('Image failed to load after 3 retries.')
        return
      }
      retryCount++
      img.src = `${img.srct}&t=${Date.now()}`
    })
  })

  for (const node of q('.fadein')) {
    fadein(node)
  }

  const setMode = (mode) => {
    html.classList.toggle('textmode', mode === 'text')
    html.classList.toggle('pixelmode', mode === 'pixel')
    resetImages()
    for (const source of q('img, video')) {
      if (mode === 'text') {
        imageDestroyers.push(ascii(source))
      } else if (mode === 'pixel') {
        imageDestroyers.push(pixelate(source, { factor: 1 }))
      }
    }
  }

  destroyers.push(
    site.subscribe((newValue, oldValue) => {
      if (newValue.mode !== oldValue.mode) {
        setMode(newValue.mode)
      }
    })
  )

  setMode(site.value.mode)

  for (const fader of q('.fadein')) {
    destroyers.push(
      observe(
        fader,
        () => {
          fadein(fader, { speed: 1 })
        },
        null,
        {
          threshold: 0.2,
          once: true,
        }
      )
    )
  }

  q('a[href^="mailto:"]').forEach(async (a) => {
    destroyers.push(await email(a))
  })

  destroyers.push(sidegallery(app))

  console.log(destroyers)

  for (const copy of q('a.copy')) {
    const onClick = (e) => {
      e.preventDefault()
      navigator.clipboard.writeText(copy.href)
      if (copy.dataset.message) {
        copy.replaceWith(copy.dataset.message)
      } else {
        copy.replaceWith('Address copied')
      }
    }
    copy.addEventListener('click', onClick)
    destroyers.push(() => copy.removeEventListener('click', onClick))
  }

  return () => {
    for (const destroy of [...destroyers, ...imageDestroyers]) {
      if (destroy) {
        destroy()
      }
    }
  }
}
