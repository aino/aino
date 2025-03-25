import { getCssVariable, q } from '@/js/utils/dom'
import { lerp } from '@/js/utils/animate'
import { outQuint } from '@/js/utils/easing'
import { CHARS } from '@/js/grid/grid3'
import * as detect from '@/js/utils/detect'

const nodeAnimations = new Map()

function addAnimation(node, offset, distance, duration) {
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
      duration,
    }
  }
}

let timer

export function stopHoverChar() {
  clearTimeout(timer)
  nodeAnimations.forEach((offsetsMap, node) => {
    const textArr = node.textContent.split('')
    for (const [offset, { char }] of Object.entries(offsetsMap)) {
      textArr[offset] = char
    }
    node.textContent = textArr.join('')
  })
  nodeAnimations.clear()
}

function loop() {
  nodeAnimations.forEach((offsetsMap, node) => {
    const textArr = node.textContent.split('')
    let updatedSomething = false

    for (const [offset, { start, char, duration }] of Object.entries(
      offsetsMap
    )) {
      const factor = 0
      const now = Date.now()
      const timing = duration * (1 - factor)
      const t = outQuint(Math.min((now - start) / timing, 1))
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

  timer = setTimeout(loop, 1000 / 40)
}

export default function hoverchar() {
  clearTimeout(timer)
  loop()
  for (const hoverchar of q('a, button, .hoverchar')) {
    if (hoverchar.dataset.active || hoverchar.closest('p')) continue
    hoverchar.dataset.active = 'true'
    const dy = hoverchar.dataset.dy || 0
    const dx = hoverchar.dataset.dx || 1
    const duration = hoverchar.dataset.duration || 1000
    const onMove = (e) => {
      const rem = getCssVariable('ch')
      const { clientX, clientY } = e
      for (let y = -dy; y <= dy; y++) {
        for (let x = -dx; x <= dx; x++) {
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
              if (
                text[offset].trim() &&
                CHARS.includes(text[offset].toUpperCase())
              ) {
                addAnimation(node, offset, Math.abs(x * y), duration)
              }
            }
            node.textContent = text.join('')
          }
        }
      }
    }
    if (detect.touch()) {
      hoverchar.addEventListener('touchmove', (e) => {
        console.log(e.touches[0])
        onMove(e.touches[0])
      })
    } else {
      hoverchar.addEventListener('mousemove', onMove)
    }
  }
}
