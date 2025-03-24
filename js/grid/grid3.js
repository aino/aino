import { insertEvery } from '@/js/utils/array'
import { lerp } from '@/js/utils/animate'
import { getCssVariable } from '@/js/utils/dom'
import { toGrayScale } from '../ascii'
import { inOutQuad } from '../utils/easing'
import { isVideoPlaying } from '../pixelate'
import onVideoFrame from '../utils/video'

const DIFFUSION = 0.001

// The character set for ASCII rendering.
export const CHARS =
  '$MBNQØW@&R8GD6S9ÖOH#ÉE5UK0ÄÅA2XP34ZC%VIF17YTJL[]?}{()<>|=+\\/^!";*_:~,\'-.·\\` '

const grayRamp = `${CHARS} `

const getCharacterForGrayScale = (grayScale) =>
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

export function fadeChar(char, opacity) {
  if (opacity === 1) return char
  return grayRamp[
    Math.floor(lerp(grayRamp.indexOf(char), grayRamp.length - 1, 1 - opacity))
  ]
}

export function interpolateChar(char, newGrayRamp) {
  const index = grayRamp.indexOf(char)
  if (index === -1) {
    return char
  }
  return newGrayRamp[
    Math.floor((newGrayRamp.length - 1) * (index / (newGrayRamp.length - 1)))
  ]
}

export function morphChar(from, to, n) {
  const fromIndex = grayRamp.indexOf(from)
  const toIndex = grayRamp.indexOf(to)
  if (fromIndex === -1 || toIndex === -1) {
    return to
  } else {
    const charIndex = Math.floor(lerp(fromIndex, toIndex, n))
    return grayRamp[charIndex]
  }
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

export default function grid(node) {
  let width,
    height,
    cols,
    rows,
    textArr = []
  let listeners = {}
  const canvases = []

  const listen = (type, fn) => {
    if (!listeners[type]) {
      listeners[type] = []
    }
    listeners[type].push(fn)
    return () => {
      listeners[type] = listeners[type].filter((l) => l !== fn)
    }
  }

  const emit = (type, payload) => {
    if (listeners[type]) {
      for (const fn of listeners[type]) {
        fn(payload)
      }
    }
  }

  const onResize = () => {
    const ch = getCssVariable('ch')
    const line = getCssVariable('line')
    const rect = node.getBoundingClientRect()
    width = rect.width
    height = rect.height
    cols = Math.round(width / ch)
    rows = Math.round(height / line)
    for (const canvas of canvases) {
      canvas.width = cols
      canvas.height = rows
    }
    const length = rows * cols
    if (length !== textArr.length) {
      textArr = new Array(length).fill(' ')
    }
    emit('resize', { cols, rows, width, height })
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
        if (p.filter) {
          value = p.filter(value)
        }
        if (/^\s$/.test(value)) {
          value = ' '
        }
        if (row < rows && col < cols) {
          const index = cols * row + col
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

  const createVideo = async (src) => {
    const points = []
    const createPoints = () => {
      points.length = 0
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          points.push(createPoint({ x: c / cols, y: r / rows, value: ' ' }))
        }
      }
    }
    createPoints()
    const video = document.createElement('video')
    video.src = src
    video.muted = true
    video.playsInline = true

    const canvas = createCanvas()

    return {
      blend: (frame, opacity = 1) => {
        paintCanvas(canvas, video, { cover: true })
        const canvasPoints = createFromCanvas(canvas, { includeEmpty: true })

        const pointMap = new Map()
        for (const c of canvasPoints) {
          const cCol = Math.round(c.x * cols)
          const cRow = Math.round(c.y * rows)
          const key = cRow * cols + cCol
          pointMap.set(key, c.value)
        }

        for (const p of frame) {
          const col = Math.round(p.x * cols)
          const row = Math.round(p.y * rows)
          const key = row * cols + col

          const videoChar = pointMap.get(key)
          if (videoChar) {
            p.value = morphChar(p.value, videoChar, opacity)
          }
        }
      },
      resize: () => {
        createPoints()
      },
      points,
      video,
    }
  }

  const setOpacity = (points, opacity) => {
    for (let i = 0, len = points.length; i < len; i++) {
      const p = points[i]
      p.value = fadeChar(p.value, opacity)
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
      p.vx += lerp(-spread, spread, norm) + (Math.random() - 0.5) * spread * 0.5
      p.vy += lerp(-0.5, -1, Math.random() * (spread * 2))
    }
  }

  const applyMorph = (points, dt) => {
    for (let i = points.length - 1; i >= 0; i--) {
      const p = points[i]
      if (!p.morph) continue

      const props = [
        'x',
        'y',
        'vx',
        'vy',
        'gravity',
        'spring',
        'friction',
        'damping',
      ]

      const now = Date.now()
      const isDone =
        Math.abs(p.x - p.morph.target.x) < 0.001 &&
        Math.abs(p.y - p.morph.target.y) < 0.001 &&
        Math.abs(p.vx - p.morph.target.vx) < 0.001 &&
        Math.abs(p.vy - p.morph.target.vy) < 0.001 &&
        p.value === p.morph.target.value
      if (isDone) {
        if (p.morph.removeAfter) {
          points[i] = points[points.length - 1]
          points.pop()
        } else {
          // ;[...props, 'value', 'context'].forEach((key) => {
          //   p[key] = p.morph.target[key]
          // })
          points[i] = { ...p.morph.target }
          delete p.morph
        }
        continue
      }

      const progress = inOutQuad((now - p.morph.start) / p.morph.duration)

      const bump = (value, destination) => {
        return value + (destination - value) * (dt * lerp(0, 10, progress))
      }

      props.forEach((key) => {
        if (p.morph.target[key] !== undefined) {
          p[key] = bump(p[key], p.morph.target[key])
        }
      })

      const fromIndex = grayRamp.indexOf(p.value)
      const toIndex = grayRamp.indexOf(p.morph.target.value)
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        p.value = p.morph.target.value
      } else {
        const charIndex = Math.round(lerp(fromIndex, toIndex, progress))
        p.value = grayRamp[charIndex]
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

    for (let i = points.length - 1; i >= 0; i--) {
      const p = points[i]
      const col = Math.round(p.x * cols)
      const row = Math.round(p.y * rows)
      if (p.removeAt && now > p.removeAt) {
        points[i] = points[points.length - 1]
        points.pop()
        continue
      }
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

  const morph = (
    from,
    to,
    { discardUnused = true, contextFilter = null, duration = 1700 } = {}
  ) => {
    const now = Date.now()
    ;[to, from].forEach((frame, i) => {
      if (!frame.length) {
        console.warn('Empty frame, creating default points', i)
        frame.push(
          createPoint({
            x: 0.5,
            y: 0.5,
            value: ' ',
          })
        )
      }
    })
    let allMarked = false
    let availableTargets = to.slice()

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

      const candidatesForValue =
        candidateMap.get(point.value) &&
        candidateMap.get(point.value).length > 0
          ? candidateMap.get(point.value)
          : availableTargets

      const candidate = findClosestPoint(point, candidatesForValue)
      if (!candidate) break

      const index = availableTargets.findIndex((t) => t.uid === candidate.uid)
      if (index !== -1) {
        availableTargets[index] = availableTargets[availableTargets.length - 1]
        availableTargets.pop()
      }
      if (candidateMap.has(candidate.value)) {
        const arr = candidateMap.get(candidate.value)
        const mapIndex = arr.findIndex((t) => t.uid === candidate.uid)
        if (mapIndex !== -1) {
          arr[mapIndex] = arr[arr.length - 1]
          arr.pop()
        }
      }
      Object.assign(point, {
        morph: {
          removeAfter: allMarked,
          target: candidate,
          start: Date.now(),
          duration,
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

        const newPoint = {
          ...candidate,
          context: targetPoint.context,
          value: ' ',
          morph: {
            target: targetPoint,
            removeAfter: false,
            start: Date.now(),
            duration,
          },
        }
        from.push(newPoint)
      }
    }
    // console.log(`Morphed in ${Date.now() - now}ms`, { ...from }, { ...to })
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
    text = text.toUpperCase()

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
    canvas,
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
    const ctx = canvas.getContext('2d')
    ctx.globalAlpha = 1
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.globalAlpha = alpha
    x = Math.round(typeof x === 'number' ? x : canvas.width / 2 - w / 2)
    y = Math.round(typeof y === 'number' ? y : canvas.height / 2 - h / 2)
    ctx.drawImage(src, x, y, w, h)
    return {
      x,
      y,
      w,
      h,
    }
  }

  const createCanvas = () => {
    const canvas = document.createElement('canvas')
    canvas.width = cols
    canvas.height = rows
    canvases.push(canvas)
    return canvas
  }

  const createFromCanvas = (
    canvas,
    { context = 'canvas', includeEmpty = false } = {}
  ) => {
    const ctx = canvas.getContext('2d')
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
      const value = getCharacterForGrayScale(l)
      if ((value.trim() && l !== 255) || includeEmpty) {
        const x = xPixel / cols
        const y = yPixel / rows
        const point = createPoint({ x, y, value, context })
        points.push(point)
      }
    }
    return points
  }

  const blend = (base, layer, { opacity = 1 } = {}) => {
    for (let i = 0, len = base.length; i < len; i++) {
      const p = base[i]
      const col = Math.round(p.x * cols)
      const row = Math.round(p.y * rows)
      const top = layer.find((q) => {
        return Math.round(q.x * cols) === col && Math.round(q.y * rows) === row
      })
      if (top) {
        p.value = morphChar(p.value, top.value, opacity)
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
    text = text.toUpperCase()
    const points = []
    if (align === 'center') {
      col = Math.floor((cols - text.length) / 2)
    }
    for (let i = 0, len = text.length; i < len; i++) {
      const value = text[i]
      const index = col + i
      const x = index / cols
      const y = row / rows
      if (value.trim()) {
        points.push(createPoint({ x, y, value, context }))
      }
    }
    return points
  }

  let raf
  let lastTimestamp = 0
  const loop = (timestamp) => {
    raf = requestAnimationFrame(loop)
    const delta = timestamp - lastTimestamp
    emit('frame', {
      delta,
      timestamp,
      fps: 1000 / delta,
    })
    lastTimestamp = timestamp
  }
  raf = requestAnimationFrame(loop)

  const destroy = () => {
    cancelAnimationFrame(raf)
    listeners = {}
  }

  return {
    render,
    morph,
    blend,
    explode,
    createCanvas,
    applyPhysics,
    createText,
    createParagraph,
    createFromCanvas,
    paintCanvas,
    gravitate,
    createPoint,
    randomize,
    listen,
    emit,
    setOpacity,
    destroy,
    createVideo,
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
