import { q, id, style, create, getCssVariable } from '@/js/utils/dom'
import grid from '../grid/grid2'
import loadimage from '@/js/utils/loadimage'
import hoverchar from '@/js/hoverchar'
import gridoverlay from '../gridoverlay'
import { observe } from '../utils/dom'
import fadein from '../fadein'
import site from '@/js/stores/site'
import ascii from '../ascii'

export const path = /.*/

export default async function global(app) {
  const destroyers = []
  for (const imageSection of q('section .image')) {
    const [img] = q('img', imageSection)
    const fitHeight = () => {
      imageSection.style.height = ''
      const rem = getCssVariable('ch')
      const { height } = imageSection.getBoundingClientRect()
      const rows = Math.floor(height / rem)
      const newHeightInRem = Math.floor(rows / 2) * 2
      imageSection.style.height = `${newHeightInRem * rem}px`
    }
    if (img.complete) {
      fitHeight()
    } else {
      img.onload = () => fitHeight()
    }
    const observer = new ResizeObserver(() => fitHeight())
    observer.observe(img)
  }

  hoverchar()

  destroyers.push(
    site.subscribe((newValue, oldValue) => {
      if (newValue.textMode !== oldValue.textMode) {
        document.documentElement.classList.toggle('textmode', newValue.textMode)
        for (const img of q('.image img')) {
          ascii(img)
        }
      }
    })
  )

  if (site.value.textMode) {
    for (const img of q('.image img')) {
      ascii(img)
    }
    setTimeout(() => {
      document.documentElement.classList.add('textmode')
    }, 40)
  }

  for (const fader of q('.fadein')) {
    destroyers.push(
      observe(
        fader,
        () => {
          fadein(fader, null, null, 1)
        },
        null,
        {
          threshold: 0.2,
          once: true,
        }
      )
    )
  }

  return () => {
    for (const destroy of destroyers) {
      destroy()
    }
  }
}
