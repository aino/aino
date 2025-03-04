import { q, id, style, create, getCssVariable } from '@/js/utils/dom'
import grid from '../grid/grid2'
import loadimage from '@/js/utils/loadimage'
import hoverchar from '@/js/hoverchar'
import gridoverlay from '../gridoverlay'
import { getStyle, observe } from '../utils/dom'
import fadein from '../fadein'
import site from '@/js/stores/site'
import ascii from '../ascii'

export const path = /.*/

export const fitHeight = (node) => {
  const adjust = () => {
    node.style.height = ''
    const ch = getCssVariable('ch')
    const { height } = node.getBoundingClientRect()
    const rows = Math.floor(height / ch)
    const newHeightInRem = Math.floor(rows / 2) * 2
    node.style.height = `${newHeightInRem * ch}px`
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

  let asciiDestroyers = []

  const applyAscii = (img) => {
    const intro = img.closest('.intro')
    let filter
    /*
    if (intro) {
      const [title] = q('.worktitle', intro)
      if (title) {
        const { top, left, width } = title.getBoundingClientRect()
        const ch = getCssVariable('ch')
        console.log(top, ch)
        const row = Math.round(top / ch / 2) - 3
        const col = Math.round(left / ch) - 2
        const len = Math.round(width / ch)
        console.log({ row, col, len })
        filter = (chars) => {
          const lines = chars.split('\n')
          const lineWidth = lines[0].length + 1
          const nextChars = chars.split('')
          for (let r = row - 1; r < row + 2; r++) {
            for (let i = -1; i < len + 1; i++) {
              nextChars[lineWidth * r + col + i] = ' '
            }
          }
          console.log(chars.length, nextChars.length) // nextChars is bigger now
          return nextChars.join('')
        }
      }
    }
      */
    asciiDestroyers.push(ascii(img, filter))
  }

  destroyers.push(
    site.subscribe((newValue, oldValue) => {
      if (newValue.textMode !== oldValue.textMode) {
        document.documentElement.classList.toggle('textmode', newValue.textMode)
        if (newValue.textMode) {
          for (const img of q('.image img')) {
            applyAscii(img)
          }
        } else {
          for (const destroy of asciiDestroyers) {
            if (destroy) {
              destroy()
            }
          }
          asciiDestroyers = []
        }
      }
    })
  )

  if (site.value.textMode) {
    for (const img of q('.image img')) {
      applyAscii(img)
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
    for (const destroy of [...destroyers, ...asciiDestroyers]) {
      if (destroy) {
        destroy()
      }
    }
  }
}
