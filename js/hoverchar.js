import { getCssVariable, q } from '@/js/utils/dom'
import { lerp } from '@/js/utils/animate'
import { outQuint } from '@/js/utils/easing'
import { CHARS } from '@/js/grid/grid2'

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

    for (const [offset, { start, char }] of Object.entries(offsetsMap)) {
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

  timer = setTimeout(loop, 1000 / 40)
}

export default function hoverchar() {
  loop()
  for (const hoverchar of q('a, .hoverchar')) {
    const dy = hoverchar.dataset.dy || 0
    const dx = hoverchar.dataset.dx || 1
    hoverchar.addEventListener('mousemove', (e) => {
      const rem = getCssVariable('rem')
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
