import { q, id, style, create, getCssVariable } from '@/js/utils/dom'
import grid from '../grid/grid2'
import loadimage from '@/js/utils/loadimage'
import hoverchar from '@/js/hoverchar'
import gridoverlay from '../gridoverlay'
import { getStyle, observe } from '../utils/dom'
import fadein from '@/js/fadein'
import site from '@/js/stores/site'
import ascii from '../ascii'
import email from '../email'
import pixelate from '../pixelate'

export const path = /.*/

const html = document.documentElement

export const fitHeight = (node) => {
  const adjust = () => {
    node.style.height = ''
    const line = getCssVariable('line')
    const { height } = node.getBoundingClientRect()
    const rows = Math.floor(Math.floor(height) / line)
    node.style.height = `${rows * line}px`
    console.log(height, rows)
  }
  const [img] = q('img', node)
  if (img.complete) {
    adjust(node)
  } else {
    img.onload = () => adjust(node)
  }
}

export default async function global(app) {
  const destroyers = []
  for (const imageSection of q('section .image')) {
    const [img] = q('img', imageSection)
    fitHeight(imageSection)
    const observer = new ResizeObserver(() => fitHeight(imageSection))
    observer.observe(img)
  }

  hoverchar()

  let imageDestroyers = []
  const resetImages = () => {
    for (const destroy of imageDestroyers) {
      destroy()
    }
    imageDestroyers = []
  }

  for (const node of q('.fadein')) {
    fadein(node)
  }

  const setMode = (mode) => {
    html.classList.toggle('textmode', mode === 'text')
    html.classList.toggle('pixelmode', mode === 'pixel')
    resetImages()
    for (const img of q('img')) {
      if (mode === 'text') {
        imageDestroyers.push(ascii(img))
      } else if (mode === 'pixel') {
        imageDestroyers.push(pixelate(img, { factor: 1 }))
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
