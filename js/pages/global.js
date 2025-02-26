import pixelate from '@/js/pixelate'
import { q, id, style, create, getCssVariable } from '@/js/utils/dom'
import grid from '../grid/grid2'
import loadimage from '@/js/utils/loadimage'
import { CHARS, fadeChar } from '../grid/grid2'
import { lerp } from '@/js/utils/animate'
import { inOutQuint, outQuint } from '../utils/easing'

export const path = /.*/

const nodeAnimations = new Map()

function addAnimation(node, offset, distance) {
  // If this node doesn't have an animation record yet, create one
  if (!nodeAnimations.has(node)) {
    nodeAnimations.set(node, {})
  }
  const offsetsMap = nodeAnimations.get(node)

  // Only add the offset if it's not already animating
  if (!(offset in offsetsMap)) {
    offsetsMap[offset] = {
      distance,
      start: Date.now(),
      char: node.textContent.split('')[offset],
    }
  }
}

export default async function global(app) {
  for (const imageSection of q('section .image')) {
    const [img] = q('img', imageSection)
    const fitHeight = () => {
      imageSection.style.height = ''
      const rem = getCssVariable('rem')
      const { height } = imageSection.getBoundingClientRect()
      const rows = Math.round(height / rem)
      const newHeightInRem = Math.floor(rows / 2) * 2
      imageSection.style.height = `${newHeightInRem}rem`
    }
    if (img.complete) {
      fitHeight()
    } else {
      img.onload = () => fitHeight()
    }
    const observer = new ResizeObserver(() => fitHeight())
    observer.observe(img)
  }

  const footer = id('footer')
  const [logo] = q('.logo', footer)
  const svg = await loadimage('/aino-agency.svg')
  const ratio = svg.width / svg.height
  logo.style.paddingBottom = `${100 / ratio}%`
  const { render, canvas, createFromCanvas } = grid(logo)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.globalAlpha = 0.06
  let scale = Math.min(canvas.width / svg.width, canvas.height / svg.height)
  const logoWidth = svg.width * scale
  const logoHeight = svg.height * scale * 0.5
  ctx.drawImage(svg, 0, 0, logoWidth * 2.03, logoHeight * 2.03)
  render(
    createFromCanvas({
      context: 'logo',
    })
  )
  const aa = create('div', { id: 'grid' }, document.body)
  style(aa, {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    opacity: 0,
    zIndex: 100,
    pointerEvents: 'none',
    wordBreak: 'break-all',
    overflow: 'hidden',
  })
  const cols = getCssVariable('cols')
  const rows = getCssVariable('rows')
  new ResizeObserver(() => {
    aa.textContent = new Array(cols * rows).fill('A').join('')
  }).observe(aa)
  document.body.appendChild(canvas)

  function loop() {
    nodeAnimations.forEach((offsetsMap, node) => {
      const textArr = node.textContent.split('')
      let updatedSomething = false

      for (const [offset, { start, char, distance }] of Object.entries(
        offsetsMap
      )) {
        const factor = 0
        const now = Date.now()
        const duration = 1000 * (1 - factor)
        const t = outQuint(Math.min((now - start) / duration, 1))
        const progress = 1 - 2 * Math.abs(t - 0.5)

        // Pick the new char
        const fromIndex = CHARS.indexOf(char.toUpperCase())
        const toIndex = Math.floor(lerp(CHARS.length - 2, fromIndex, factor))
        const charIndex = Math.floor(lerp(fromIndex, toIndex, progress))

        const newChar = CHARS[charIndex]
        textArr[offset] = newChar
        updatedSomething = true

        // If animation is complete, remove this offset
        if (t === 1) {
          textArr[offset] = char
          delete offsetsMap[offset]
        }
      }

      // Update textContent once if we changed anything
      if (updatedSomething) {
        node.textContent = textArr.join('')
      }

      // If no offsets remain, remove this node from the map
      if (Object.keys(offsetsMap).length === 0) {
        nodeAnimations.delete(node)
      }
    })

    setTimeout(loop, 1000 / 40)
  }
  loop()

  for (const hoverchar of document.querySelectorAll('.hoverchar')) {
    hoverchar.addEventListener('mousemove', (e) => {
      const rem = getCssVariable('rem')
      const { clientX, clientY } = e
      const box = hoverchar.getBoundingClientRect()
      for (let y = -1; y < 2; y++) {
        for (let x = -1; x < 2; x++) {
          const cx = clientX + x * rem
          const cy = clientY + y * rem * 2
          let range
          // Modern API
          if (document.caretPositionFromPoint) {
            const caret = document.caretPositionFromPoint(cx, cy)
            if (!caret) return
            range = document.createRange()
            range.setStart(caret.offsetNode, caret.offset)
            range.setEnd(caret.offsetNode, caret.offset)
          }
          // Older API (WebKit/Blink)
          else if (document.caretRangeFromPoint) {
            range = document.caretRangeFromPoint(cx, cy)
          }

          if (!range) break

          const rects = range.getClientRects()
          if (!rects.length) break

          const rect = [...rects][0]

          const node = range.startContainer
          const offset = range.startOffset

          const right = rect.left + rem * offset

          if (cx > right) {
            break
          }

          // If it's a text node, we can find the specific character:
          if (
            node &&
            node.nodeType === Node.TEXT_NODE &&
            hoverchar.contains(node)
          ) {
            const text = (node.textContent || '').split('')
            // Make sure offset is valid:
            if (offset >= 0 && offset < text.length) {
              if (text[offset].trim()) {
                addAnimation(node, offset, Math.abs(x * y))
              }
            }
            node.textContent = text.join('')
          }
        }
      }
    })
  }
}
