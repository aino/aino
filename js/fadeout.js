import { getCssVariable, q } from '@/js/utils/dom'
import { lerp } from '@/js/utils/animate'
import { outQuint } from '@/js/utils/easing'
import { CHARS } from '@/js/grid/grid3'
import wait from '@/js/utils/wait'
import { inOutQuad, inQuad, inQuint } from './utils/easing'

const nodeAnimations = new Map()

function getTextNodes(element) {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT, // Only consider text nodes
    null,
    false
  )

  const textNodes = []
  let currentNode = walker.nextNode()
  while (currentNode) {
    textNodes.push(currentNode)
    currentNode = walker.nextNode()
  }

  return textNodes
}

let onComplete = () => {}

function loop() {
  nodeAnimations.forEach((offsetsMap, node) => {
    const textArr = node.textContent.split('')
    let updatedSomething = false

    for (const [offset, { start, char, duration }] of Object.entries(
      offsetsMap
    )) {
      const factor = 0
      const now = Date.now()
      if (start > now) {
        continue
      }
      const timing = duration * (1 - factor)
      const t = inOutQuad(Math.min((now - start) / timing, 1))
      const progress = t

      // Pick the new char
      const fromIndex = CHARS.indexOf(char.toUpperCase())
      const toIndex = Math.floor(lerp(CHARS.length, fromIndex, factor))
      const charIndex = Math.floor(lerp(fromIndex, toIndex, progress))

      const newChar = CHARS[charIndex]
      textArr[offset] = newChar
      updatedSomething = true

      // If animation is complete, remove this offset
      if (t === 1) {
        // textArr[offset] = char
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

  if (!nodeAnimations.size) {
    onComplete()
  } else {
    requestAnimationFrame(loop)
  }
}

function addAnimation(node, offset, delay, duration) {
  // If this node doesn't have an animation record yet, create one
  if (!nodeAnimations.has(node)) {
    nodeAnimations.set(node, {})
  }
  const offsetsMap = nodeAnimations.get(node)

  // Only add the offset if it's not already animating
  if (!(offset in offsetsMap)) {
    offsetsMap[offset] = {
      start: Date.now() + delay,
      char: node.textContent.split('')[offset],
      duration,
    }
  }
}

export default function fadeout(
  node,
  { filter, ready, speed = 2, duration = 400 } = {}
) {
  let textNodes = getTextNodes(node)
  if (filter) {
    textNodes = textNodes.filter(filter)
  }
  if (ready) {
    onComplete = ready
  }
  const start = async () => {
    let d = 0
    for (const node of textNodes) {
      if (node.textContent.trim()) {
        const text = node.textContent.split('')
        for (let i = 0; i < text.length; i++) {
          addAnimation(node, i, d, duration)
          d += speed
        }
      }
    }
    loop()
  }
  start()
}
