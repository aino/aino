import { insertEvery } from '@/js/utils/array'
import animate, { lerp } from '@/js/utils/animate'
import { getCssVariable } from '@/js/utils/dom'
import { toGrayScale } from '../ascii'
import { inQuad, outQuad, inOutCirc, outCirc, inCirc } from '../utils/easing'
import { create, getStyle, style } from '../utils/dom'

const DIFFUSION = 0.001
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

// The character set for ASCII rendering.
export const CHARS =
  '$MBNQØW@&R8GD6S9ÖOH#E5UK0ÄÅA2XP34ZC%VIF17YTJL[]?}{()<>|=+\\/^!";*_:~,\'-.·\\` '

const getCharacterForGrayScale = (grayScale, grayRamp) =>
  grayRamp[Math.ceil(((grayRamp.length - 1) * grayScale) / 255)]

function generateUID() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  let uid = ''
  const lettersLen = letters.length
  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * lettersLen)
    uid += letters[randomIndex]
  }
  return uid
}

export function fadeChar(char, opacity, grayRamp = CHARS) {
  return grayRamp[
    Math.floor(lerp(grayRamp.indexOf(char), grayRamp.length - 1, 1 - opacity))
  ]
}

export function smoothDamp(current, target, currentVelocity, smoothTime, dt) {
  smoothTime = Math.max(0.0001, smoothTime)
  const omega = 2 / smoothTime
  const x = omega * dt
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x)
  const change = current - target
  const temp = (currentVelocity + omega * change) * dt
  const newVelocity = (currentVelocity - omega * temp) * exp
  const newValue = target + (change + temp) * exp
  return [newValue, newVelocity]
}

function findClosestPoint(target, points) {
  let minDist = Infinity
  let closest = null
  const candidates = []
  // Use an index-based loop with cached length.
  for (let i = 0, len = points.length; i < len; i++) {
    const p = points[i]
    if (p.value === target.value) {
      candidates.push(p)
    }
  }
  // If no candidate with matching value, use all points.
  const arr = candidates.length ? candidates : points
  for (let i = 0, len = arr.length; i < len; i++) {
    const p = arr[i]
    const dx = target.x - p.x
    const dy = target.y - p.y
    const dist = dx * dx + dy * dy
    if (dist < minDist) {
      minDist = dist
      closest = p
    }
  }
  return closest
}

export default function grid(node, grayRamp = CHARS.replace(' ', ' ')) {
  let width,
    height,
    rem,
    line,
    cols,
    rows,
    textArr = []
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const listeners = {}

  const listen = (type, fn) => {
    if (!listeners[type]) {
      listeners[type] = []
    }
    listeners[type].push(fn)

    // Return an unsubscribe function
    return () => {
      listeners[type] = listeners[type].filter((l) => l !== fn)
    }
  }

  // Emit/trigger the event
  const emit = (type, payload) => {
    if (listeners[type]) {
      for (const fn of listeners[type]) {
        fn(payload)
      }
    }
  }

  const onResize = () => {
    rem = getCssVariable('ch')
    line = rem * 2
    const rect = node.getBoundingClientRect()
    width = rect.width
    height = rect.height
    cols = Math.round(width / rem)
    rows = Math[isSafari ? 'ceil' : 'round'](height / line)
    canvas.width = cols
    canvas.height = rows
    const length = rows * cols
    if (length !== textArr.length) {
      textArr = new Array(length).fill(' ')
    }
  }
  new ResizeObserver(() => onResize()).observe(node)
  onResize()

  const render = (...frames) => {
    textArr.fill(' ')
    for (let f = 0, flen = frames.length; f < flen; f++) {
      const points = frames[f]
      emit('render', points)

      for (let i = 0, plen = points.length; i < plen; i++) {
        const p = points[i]
        const col = Math.round(p.x * cols)
        const row = Math.round(p.y * rows)
        let value = p.value
        if (/^\s$/.test(value)) {
          value = ' '
        }
        if (row < rows && col < cols) {
          const index = cols * row + col
          // Only overwrite if there isn’t already a non-space char and
          // if morph.removeAfter is flagged.
          if (textArr[index]?.trim() && p.morph?.removeAfter) {
            continue
          }
          textArr[index] = value
        }
      }
    }
    const next = insertEvery(textArr, '\n', cols)
    node.textContent = next.join('')
  }

  const setOpacity = (points, opacity) => {
    for (let i = 0, len = points.length; i < len; i++) {
      const p = points[i]
      p.value = fadeChar(p.value, opacity, grayRamp)
    }
  }

  const explode = (points, { spread = 0.3 } = {}) => {
    let minX = Infinity,
      maxX = -Infinity
    for (let i = 0, len = points.length; i < len; i++) {
      const p = points[i]
      if (p.x < minX) minX = p.x
      if (p.x > maxX) maxX = p.x
    }
    if (minX === maxX) {
      minX = 0
      maxX = 1
    }
    for (let i = 0, len = points.length; i < len; i++) {
      const p = points[i]
      const norm = (p.x - minX) / (maxX - minX)
      p.vx = lerp(-spread, spread, norm) + (Math.random() - 0.5) * spread * 0.5
      p.vy = lerp(-0.5, -1, Math.random() * (spread * 2))
    }
  }

  const applyMorph = (points, dt) => {
    // Use reverse loop for safe splicing.
    for (let i = points.length - 1; i >= 0; i--) {
      const p = points[i]
      if (!p.morph) continue

      const dx = p.morph.toX - p.x
      const dy = p.morph.toY - p.y

      if (
        Math.abs(dx) < 0.01 &&
        Math.abs(dy) < 0.01 &&
        p.morph.toValue === p.value
      ) {
        if (p.morph.removeAfter) {
          // Swap-pop removal.
          points[i] = points[points.length - 1]
          points.pop()
          continue
        } else {
          p.x = p.morph.toX
          p.y = p.morph.toY
          p.vx = 0
          p.vy = 0
          p.value = p.morph.toValue
          delete p.morph
        }
      } else {
        const ax = dx * p.spring
        const ay = dy * p.spring

        const now = performance.now() // High-resolution time

        const smoothTime = 0.5

        if (!p.morph.startTime) {
          p.morph.startTime = now // Set start time when morph begins
          // totalDistance * 2000
          p.morph.duration = smoothTime * lerp(2.2, 3.2, Math.random()) * 1000 // Set morph duration in milliseconds
        }

        // Calculate time-based progress
        const elapsed = now - p.morph.startTime
        let progress = elapsed / p.morph.duration

        // Clamp progress between 0 and 1
        progress = Math.max(0, Math.min(1, progress))

        // Apply easing function for smooth interpolation
        // progress = inQuad(progress) // Or use any easing function

        if (p.morph.anim === undefined) {
          p.morph.anim = {
            x: p.x,
            y: p.y,
            vx: p.vx,
            vy: p.vy,
            nextVx: 0,
            nextVy: 0,
          }
        }

        const [newX, newVx] = smoothDamp(
          p.morph.anim.x,
          p.morph.toX,
          p.morph.anim.vx,
          smoothTime,
          dt
        )

        const [newY, newVy] = smoothDamp(
          p.morph.anim.y,
          p.morph.toY,
          p.morph.anim.vy,
          smoothTime,
          dt
        )

        p.morph.anim = {
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy,
          nextVx: (p.vx + ax) * p.friction,
          nextVy: (p.vy + ay) * p.friction,
        }

        p.vx += (p.morph.anim.nextVx - p.vx) / 20
        p.vy += (p.morph.anim.nextVy - p.vy) / 20

        p.x = lerp(
          p.x + p.vx * dt,
          p.morph.anim.x,
          inCirc(elapsed / (p.morph.duration * 1.5))
        )
        p.y = lerp(
          p.y + p.vy * dt,
          p.morph.anim.y,
          inCirc(elapsed / (p.morph.duration * 1.5))
        )

        const fromIndex = grayRamp.indexOf(p.morph.fromValue)
        const toIndex = grayRamp.indexOf(p.morph.toValue)
        const charIndex = Math.floor(lerp(fromIndex, toIndex, progress))
        if (
          fromIndex === -1 ||
          toIndex === -1 ||
          p.morph.fromValue === p.morph.toValue
        ) {
          p.value = p.morph.toValue
        } else {
          p.value = grayRamp[charIndex]
        }
      }
    }
  }

  const applyPhysics = (points, delta = 0) => {
    const dt = Math.min(0.1, delta / 1000)
    const floor = (rows - 1) / rows

    applyMorph(points, dt)

    const dots = []
    const collisions = []

    const applyFriction = (point) => {
      if (point.y === floor && Math.abs(point.vy) < 0.005) {
        point.vy = 0
        point.vx *= 0.95
        if (Math.abs(point.vx) < 0.005) {
          point.vx = 0
        }
      }
    }

    const now = Date.now()

    const atFloor = (point) =>
      Math.abs(point.vy) < 0.001 &&
      Math.abs(point.vx) < 0.001 &&
      point.y === floor &&
      point.gravity

    // Update velocities and positions.
    for (let i = points.length - 1; i >= 0; i--) {
      const p = points[i]
      const col = Math.round(p.x * cols)
      const row = Math.round(p.y * rows)
      if (p.removeAt && now > p.removeAt) {
        points[i] = points[points.length - 1]
        points.pop()
        continue
      }
      if (!p.morph) {
        if (!dots[row]) {
          dots[row] = []
        }
        if (dots[row][col]) {
          collisions.push([p, dots[row][col]])
        } else {
          dots[row][col] = p
        }
        if (atFloor(p) && !p.removeAt) {
          p.removeAt = now + 800
        }
        if (p.removeAt && now > p.removeAt && atFloor(p)) {
          points[i] = points[points.length - 1]
          points.pop()
          console.log('removed')
          continue
        }
        p.vy += p.gravity * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
      }

      if (p.x <= 0 || p.x >= 1) {
        p.vx *= -p.damping
        p.x = Math.max(0, Math.min(1, p.x))
      }
      if (p.y >= floor) {
        p.vy *= -p.damping
        p.y = floor
      }
      if (p.y <= 0) {
        p.vy *= -p.damping
        p.y = 0
      }
      applyFriction(p)
    }

    for (const [e, d] of collisions) {
      const vCollision = { x: e.x - d.x, y: e.y - d.y }
      const distance = Math.sqrt(
        (e.x - d.x) * (e.x - d.x) + (e.y - d.y) * (e.y - d.y)
      )
      const vCollisionNorm = {
        x: vCollision.x / distance,
        y: vCollision.y / distance,
      }
      const vRelativeVelocity = {
        x: d.vx - e.vx,
        y: d.vy - e.vy,
      }
      const speed =
        vRelativeVelocity.x * vCollisionNorm.x +
        vRelativeVelocity.y * vCollisionNorm.y
      if (speed >= 0) {
        const impulse = (2 * speed) / 2
        d.vx -= impulse * vCollisionNorm.x * d.damping
        d.vy -= impulse * vCollisionNorm.y * d.damping
        e.vx += impulse * vCollisionNorm.x * e.damping
        e.vy += impulse * vCollisionNorm.y * e.damping
      }
      applyFriction(d)
      applyFriction(e)
    }
  }

  // --- Optimized morph function using a lookup map by character ---
  const morph = (
    from,
    to,
    { discardUnused = true, contextFilter = null } = {}
  ) => {
    const now = Date.now()
    // Ensure frames are nonempty.
    ;[to, from].forEach((frame, i) => {
      if (!frame.length) {
        console.warn('Empty frame, creating default points', i)
        frame.push(
          createPoint({
            x: 0.5,
            y: 0.5,
            value: ' ', // non-breaking space
          })
        )
      }
    })

    let allMarked = false
    let availableTargets = to.slice()

    // Build a lookup map grouping available targets by their character value.
    const candidateMap = new Map()
    for (let j = 0, tlen = availableTargets.length; j < tlen; j++) {
      const t = availableTargets[j]
      if (!candidateMap.has(t.value)) {
        candidateMap.set(t.value, [])
      }
      candidateMap.get(t.value).push(t)
    }

    for (let i = 0, len = from.length; i < len; i++) {
      const point = from[i]
      if (contextFilter && point.context !== contextFilter) {
        continue
      }
      if (availableTargets.length === 0 && discardUnused) {
        availableTargets = to.slice()
        // Rebuild the candidate map.
        candidateMap.clear()
        for (let j = 0, tlen = availableTargets.length; j < tlen; j++) {
          const t = availableTargets[j]
          if (!candidateMap.has(t.value)) {
            candidateMap.set(t.value, [])
          }
          candidateMap.get(t.value).push(t)
        }
        allMarked = true
      }
      if (availableTargets.length === 0) break

      // Try to use the candidates matching the point's character.
      const candidatesForValue =
        candidateMap.get(point.value) &&
        candidateMap.get(point.value).length > 0
          ? candidateMap.get(point.value)
          : availableTargets

      const candidate = findClosestPoint(point, candidatesForValue)
      if (!candidate) break

      // Remove candidate from availableTargets.
      const index = availableTargets.findIndex((t) => t.uid === candidate.uid)
      if (index !== -1) {
        availableTargets[index] = availableTargets[availableTargets.length - 1]
        availableTargets.pop()
      }
      // Also remove candidate from the lookup map (if it exists).
      if (candidateMap.has(candidate.value)) {
        const arr = candidateMap.get(candidate.value)
        const mapIndex = arr.findIndex((t) => t.uid === candidate.uid)
        if (mapIndex !== -1) {
          arr[mapIndex] = arr[arr.length - 1]
          arr.pop()
        }
      }

      Object.assign(point, {
        gravity: 0,
        context: candidate.context,
        morph: {
          toX: candidate.x,
          toY: candidate.y,
          fromX: point.x,
          fromY: point.y,
          fromValue: point.value,
          toValue: candidate.value,
          removeAfter: allMarked,
        },
      })
    }

    if (!allMarked) {
      let availableFrom = from.slice()
      if (contextFilter) {
        availableFrom = availableFrom.filter((p) => p.context === contextFilter)
      }
      for (let i = 0, len = availableTargets.length; i < len; i++) {
        const targetPoint = availableTargets[i]
        if (availableFrom.length === 0) {
          availableFrom = from.slice()
        }
        const candidate = findClosestPoint(targetPoint, availableFrom)
        if (!candidate) break

        const idx = availableFrom.findIndex((f) => f.uid === candidate.uid)
        if (idx !== -1) {
          availableFrom[idx] = availableFrom[availableFrom.length - 1]
          availableFrom.pop()
        }

        const x = candidate.x
        const y = candidate.y

        const newPoint = {
          ...candidate,
          gravity: 0,
          context: targetPoint.context,
          value: ' ',
          x,
          y,
          morph: {
            toX: targetPoint.x,
            toY: targetPoint.y,
            fromX: x,
            fromY: y,
            fromValue: ' ',
            toValue: targetPoint.value,
          },
        }
        from.push(newPoint)
      }
    }
    console.log(`Morphed in ${Date.now() - now}ms`)
  }

  const randomize = (points, { spread = 1 } = {}) => {
    for (let i = 0, len = points.length; i < len; i++) {
      const p = points[i]
      p.x = lerp(p.x, Math.random(), spread)
      p.y = lerp(p.y, Math.random(), spread)
    }
  }

  const gravitate = (points, { gravity = 3, damping = 0.8 } = {}) => {
    for (let i = 0, len = points.length; i < len; i++) {
      const p = points[i]
      delete p.morph
      Object.assign(p, { gravity, damping })
    }
  }

  const createParagraph = ({
    text,
    width = 40,
    col = 0,
    row = 0,
    align = 'left',
    context = '',
  }) => {
    const points = []
    if (!text || !cols || !rows) return []

    const tokens = text.split(/(\n)/)
    const lines = []
    let currentLine = []
    for (let i = 0, tlen = tokens.length; i < tlen; i++) {
      const token = tokens[i]
      if (token === '\n') {
        lines.push(currentLine.join(' '))
        currentLine = []
      } else {
        const words = token.split(/\s+/).filter((w) => w.length > 0)
        for (let j = 0, wlen = words.length; j < wlen; j++) {
          const word = words[j]
          const lineLength = currentLine.join(' ').length
          if (lineLength + word.length + (lineLength > 0 ? 1 : 0) <= width) {
            currentLine.push(word)
          } else {
            lines.push(currentLine.join(' '))
            currentLine = [word]
          }
        }
      }
    }
    if (currentLine.length > 0) {
      lines.push(currentLine.join(' '))
    }

    const alignedLines = lines.map((line) => {
      if (align === 'center') {
        const padding = Math.max(0, Math.floor((width - line.length) / 2))
        return ' '.repeat(padding) + line
      } else if (align === 'right') {
        return line.padStart(width, ' ')
      } else if (align === 'justified') {
        const wordsArray = line.split(' ')
        if (wordsArray.length === 1) {
          return line.padEnd(width, ' ')
        } else {
          const totalChars = wordsArray.reduce(
            (sum, word) => sum + word.length,
            0
          )
          const totalSpaces = width - totalChars
          const slots = wordsArray.length - 1
          const spaceWidth = Math.floor(totalSpaces / slots)
          const extraSpaces = totalSpaces % slots
          let justifiedLine = ''
          for (let i = 0, len = wordsArray.length; i < len; i++) {
            justifiedLine += wordsArray[i]
            if (i < slots) {
              const spacesToAdd = spaceWidth + (i < extraSpaces ? 1 : 0)
              justifiedLine += ' '.repeat(spacesToAdd)
            }
          }
          return justifiedLine
        }
      } else {
        return line.padEnd(width, ' ')
      }
    })

    for (let r = 0, len = alignedLines.length; r < len; r++) {
      if (r + row >= rows) break
      points.push(
        ...createText({
          row: row + r,
          col,
          text: alignedLines[r].slice(0, cols - col),
          context,
        })
      )
    }
    return points
  }

  const paintCanvas = (
    src,
    { cover = false, scale = 1, alpha = 1, x, y } = {}
  ) => {
    const srcWidth = src.videoWidth || src.width
    const srcHeight = src.videoHeight || src.height
    let s =
      Math[cover ? 'max' : 'min'](
        canvas.width / srcWidth,
        (canvas.height / srcHeight) * 2
      ) * scale
    const w = srcWidth * s
    const h = srcHeight * s * 0.5
    ctx.globalAlpha = 1
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.globalAlpha = alpha
    x = typeof x === 'number' ? x : canvas.width / 2 - w / 2
    y = typeof y === 'number' ? y : canvas.height / 2 - h / 2
    ctx.drawImage(src, x, y, w, h)
    return {
      x,
      y,
      w,
      h,
    }
  }

  const createFromCanvas = ({ context = 'canvas' } = {}) => {
    const points = []
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    const len = data.length
    for (let i = 0; i < len; i += 4) {
      const pixelIndex = i / 4
      const xPixel = pixelIndex % canvas.width
      const yPixel = Math.floor(pixelIndex / canvas.width)
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2]
      const l = toGrayScale({ r, g, b })
      const value = getCharacterForGrayScale(l, grayRamp)
      if (value.trim() && l !== 255) {
        const x = xPixel / cols
        const y = yPixel / rows
        const point = createPoint({ x, y, value, context })
        points.push(point)
      }
    }
    return points
  }

  const blend = (base, layer, { opacity = 1, fallback = null } = {}) => {
    for (let i = 0, len = base.length; i < len; i++) {
      const p = base[i]
      const col = Math.round(p.x * cols)
      const row = Math.round(p.y * rows)
      const top = layer.find((q) => {
        return Math.round(q.x * cols) === col && Math.round(q.y * rows) === row
      })
      if (top) {
        const fromIndex = grayRamp.indexOf(p.value)
        const toIndex = grayRamp.indexOf(top.value)
        if (fromIndex === -1 || toIndex === -1) {
          p.value = top.value
        } else {
          const charIndex = Math.floor(lerp(fromIndex, toIndex, opacity))
          p.value = grayRamp[charIndex]
        }
      } else if (typeof fallback === 'string') {
        p.value = fallback
      }
    }
  }

  const createPoint = ({ x, y, value, context = '' }) => {
    return {
      x: x + (Math.random() - 0.5) * DIFFUSION,
      y: Math.max(0, Math.min(1, y)),
      value,
      context,
      vx: 0,
      vy: 0,
      gravity: 0,
      damping: 0.7,
      spring: 0.4,
      friction: 0.9,
      uid: generateUID(),
    }
  }

  const createText = ({
    row = 0,
    col = 0,
    text,
    context = '',
    align = 'left',
  }) => {
    if (!text) return []
    const points = []
    if (align === 'center') {
      col = Math.floor((cols - text.length) / 2)
    }
    for (let i = 0, len = text.length; i < len; i++) {
      const value = text[i]
      const index = col + i
      const x = index / cols
      const y = row / rows
      points.push(createPoint({ x, y, value, context }))
    }
    return points
  }

  let loggers = create('div')
  style(loggers, {
    position: 'fixed',
    top: 'calc(100vh - 2rem)',
    left: '1rem',
    opacity: 0.3,
  })

  document.body.appendChild(loggers)

  const startRenderLoop = (points = []) => {
    const logger = create('div')
    loggers.appendChild(logger)
    let lastTimestamp = 0
    let raf
    const loop = (timestamp) => {
      raf = requestAnimationFrame(loop)
      setTimeout(() => {
        const delta = timestamp - lastTimestamp
        if (lastTimestamp !== 0) {
          const delta = timestamp - lastTimestamp
          const fps = 1000 / delta
          logger.textContent = `FPS: ${fps.toFixed(2)}` // Print FPS to the console with 2 decimal places.
        }
        emit('frame', {
          delta,
          timestamp,
          points,
        })
        applyPhysics(points, delta)
        render(points)
        lastTimestamp = timestamp
      })
    }
    raf = requestAnimationFrame(loop)
    return {
      update(newPoints) {
        points = newPoints
      },
      destroy() {
        cancelAnimationFrame(raf)
        loggers.removeChild(logger)
      },
    }
  }

  return {
    render,
    morph,
    blend,
    explode,
    canvas,
    applyPhysics,
    createText,
    createParagraph,
    createFromCanvas,
    paintCanvas,
    gravitate,
    createPoint,
    startRenderLoop,
    randomize,
    listen,
    emit,
    setOpacity,
    dimensions: {
      get width() {
        return width
      },
      get height() {
        return height
      },
      get rows() {
        return rows
      },
      get cols() {
        return cols
      },
    },
    textArr,
  }
}
