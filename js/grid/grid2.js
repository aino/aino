import { insertEvery } from '@/js/utils/array'
import animate, { lerp } from '@/js/utils/animate'
import { getCssVariable } from '@/js/utils/dom'
import { getCharacterForGrayScale, toGrayScale } from '../ascii'
import { inQuad, outQuad, inOutCirc, outCirc, inCirc } from '../utils/easing'

const DIFFUSION = 0.001

// The character set for ASCII rendering.
const CHARS = `$MBNQW@&R8GD6S9OH#E5UK0A2XP34ZC%VIF17YTJL[]?}{()<>|=+\\/^!";*_:~,'-.·\` `

function generateUID() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  let uid = ''

  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * letters.length)
    uid += letters[randomIndex]
  }

  return uid
}

function smoothDamp(current, target, currentVelocity, smoothTime, dt) {
  // Ensure smoothTime is nonzero to avoid division by zero.
  smoothTime = Math.max(0.0001, smoothTime)
  const omega = 2 / smoothTime
  const x = omega * dt
  // Exponential decay factor.
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

  let arr = []

  for (const p of points) {
    if (p.value === target.value) {
      arr.push(p)
    }
  }
  if (!arr.length) {
    arr = points
  }
  // Loop over each candidate point.
  for (let i = 0; i < arr.length; i++) {
    const p = arr[i]

    // Calculate the squared distance (no need for the square root).
    const dx = target.x - p.x
    const dy = target.y - p.y
    const dist = dx * dx + dy * dy

    // Update the closest point if this one is nearer.
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
    rem,
    line,
    cols,
    rows,
    textArr = []
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  const onResize = () => {
    rem = getCssVariable('rem')
    line = rem * 2
    const rect = node.getBoundingClientRect()
    width = rect.width
    height = rect.height
    cols = Math.round(width / rem)
    rows = Math.round(height / line)
    canvas.width = cols
    canvas.height = rows
    const length = rows * cols
    if (length !== textArr.length) {
      textArr = Array.from({ length: rows * cols }).fill(' ')
    }
  }
  new ResizeObserver(() => onResize()).observe(node)
  onResize()

  const render = (...frames) => {
    textArr.fill(' ')
    for (const points of frames) {
      for (let i = 0; i < points.length; i++) {
        const p = points[i]
        const col = Math.round(p.x * cols)
        const row = Math.round(p.y * rows)
        let value = p.value
        if (/^\s$/.test(value)) {
          value = ' '
        }
        if (row < rows && col < cols) {
          const index = cols * row + col
          if (textArr[index]?.trim() && p.morph?.removeAfter) {
            continue
          }
          textArr[cols * row + col] = value
        }
      }
    }
    node.textContent = insertEvery(textArr, '\n', cols).join('')
  }

  const explode = (points, { spread = 0.3 } = {}) => {
    let minX = Infinity,
      maxX = -Infinity
    for (let i = 0; i < points.length; i++) {
      const p = points[i]
      if (p.x < minX) minX = p.x
      if (p.x > maxX) maxX = p.x
    }
    // Avoid division by zero.
    if (minX === maxX) {
      minX = 0
      maxX = 1
    }
    for (let i = 0; i < points.length; i++) {
      const p = points[i]
      // Normalize x position to [0, 1] within the frame.
      const norm = (p.x - minX) / (maxX - minX)
      p.vx = lerp(-spread, spread, norm) + (Math.random() - 0.5) * spread * 0.5
      p.vy = lerp(-0.5, -1, Math.random())
    }
  }

  const applyMorph = (points, dt) => {
    for (let i = 0; i < points.length; i++) {
      const p = points[i]
      if (!p.morph) {
        continue
      }
      // Calculate the differences to the target.
      const dx = p.morph.toPoint.x - p.x
      const dy = p.morph.toPoint.y - p.y
      const isBouncing =
        (p.morph.fromX < p.morph.toPoint.x && dx < -0.01) ||
        (p.morph.fromX > p.morph.toPoint.x && dx > 0.01) ||
        (p.morph.fromY < p.morph.toPoint.y && dy < -0.01) ||
        (p.morph.fromY > p.morph.toPoint.y && dy > 0.01)

      if (
        isBouncing ||
        (Math.abs(dx) < 0.01 &&
          Math.abs(dy) < 0.01 &&
          p.morph.toPoint.value === p.value)
      ) {
        if (p.morph.removeAfter) {
          points.splice(i, 1)
          i--
          continue
        } else {
          // Once the point is close enough to its destination, snap it in place.
          p.x = p.morph.toPoint.x
          p.y = p.morph.toPoint.y
          p.vx = 0
          p.vy = 0
          p.value = p.morph.toValue // ensure the final character is the target value
          delete p.morph
        }
      } else {
        // Compute the spring-like acceleration.
        const ax = dx * p.spring
        const ay = dy * p.spring

        // Update velocities (with damping).

        const currentDistance = Math.sqrt(dx * dx + dy * dy)
        // Total distance from starting point to target.
        const totalDistance = Math.sqrt(
          Math.pow(p.morph.toPoint.x - p.morph.fromX, 2) +
            Math.pow(p.morph.toPoint.y - p.morph.fromY, 2)
        )

        // progress = 0 at the start, 1 at the finish.
        let progress = 1 - currentDistance / totalDistance
        progress = Math.max(0, Math.min(1, progress)) // clamp to [0, 1]

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
          p.morph.toPoint.x,
          p.morph.anim.vx,
          0.4,
          dt
        )

        const [newY, newVy] = smoothDamp(
          p.morph.anim.y,
          p.morph.toPoint.y,
          p.morph.anim.vy,
          0.4,
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

        p.vx += (p.morph.anim.nextVx - p.vx) / lerp(10, 1, progress)
        p.vy += (p.morph.anim.nextVy - p.vy) / lerp(10, 1, progress)

        if (progress > 0.99) {
          progress = 1
        }
        // Update positions.
        p.x = lerp(p.x + p.vx * dt, p.morph.anim.x, inQuad(progress))
        p.y = lerp(p.y + p.vy * dt, p.morph.anim.y, inQuad(progress))

        // --- Fade the character ---
        // Make sure that both the from and to values are in chars.
        const fromIndex = CHARS.indexOf(p.morph.fromValue)
        const toIndex = CHARS.indexOf(p.morph.toValue)
        const charIndex = Math.floor(lerp(fromIndex, toIndex, progress))
        if (
          fromIndex === -1 ||
          toIndex === -1 ||
          p.morph.fromValue === p.morph.toValue
        ) {
          // Fallback if one of the characters isn’t found.
          p.value = p.morph.toValue
        } else {
          // Interpolate between fromIndex and toIndex.
          p.value = CHARS[charIndex]
        }
      }
    }
  }

  // In this version, we run a continuous loop via applyPhysics.
  const applyPhysics = (points, delta = 0) => {
    const dt = Math.min(0.1, delta / 1000)
    const floor = (rows - 1) / rows
    const radiusX = 0.05 / cols
    const radiusY = 0.08 / rows
    const combinedRadius = 8
    const combinedRadiusSqr = combinedRadius * combinedRadius

    applyMorph(points, dt)

    // Update velocities and positions.
    for (let i = 0; i < points.length; i++) {
      const p = points[i]

      if (p.morph) {
        continue
      }

      if (Math.abs(p.vy) < 0.0001 && p.y >= 0.95) {
        points.splice(i, 1)
        i--
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
      // Ground friction: if at the bottom and nearly stopped, dampen horizontal velocity.
      if (p.y === floor && Math.abs(p.vy) < 0.001) {
        p.vy = 0
        p.vx *= 0.95
        if (Math.abs(p.vx) < 0.001) {
          p.vx = 0
        }
      }
    }

    // --- Spatial Partitioning ---
    // Choose cell sizes based on the radii.
    const cellSizeX = 2 * radiusX
    const cellSizeY = 2 * radiusY
    const gridCols = Math.ceil(1 / cellSizeX)
    const gridRows = Math.ceil(1 / cellSizeY)
    const gridCells = new Array(gridCols * gridRows)
    // Preinitialize each grid cell as an empty array.
    for (let i = 0; i < gridCells.length; i++) {
      gridCells[i] = []
    }
    // Place each point into its cell.
    for (let i = 0; i < points.length; i++) {
      const p = points[i]
      if (p.morph) {
        continue
      }
      const cellX = Math.floor(p.x / cellSizeX)
      const cellY = Math.floor(p.y / cellSizeY)
      const index = cellX + cellY * gridCols
      if (gridCells[index]) {
        gridCells[index].push(p)
      }
    }

    // Collision resolution helper.
    const processCollision = (p, q) => {
      const tol = 0.001
      // Special handling for points on the floor.
      if (Math.abs(p.y - floor) < tol && Math.abs(q.y - floor) < tol) {
        const minSeparation = 0.1
        const dx = p.x - q.x
        if (Math.abs(dx) < minSeparation) {
          const overlap = minSeparation - Math.abs(dx)
          if (!p.fixed && !q.fixed) {
            p.x += dx >= 0 ? overlap / 2 : -overlap / 2
            q.x += dx >= 0 ? -overlap / 2 : overlap / 2
          } else if (!p.fixed) {
            p.x += dx >= 0 ? overlap : -overlap
          } else if (!q.fixed) {
            q.x += dx >= 0 ? -overlap : overlap
          }
          p.vx = 0
          q.vx = 0
          return
        }
      }

      let dx = p.x - q.x
      let dy = p.y - q.y
      const scaledDx = dx / radiusX
      const scaledDy = dy / radiusY
      const sqrDist = scaledDx * scaledDx + scaledDy * scaledDy

      if (sqrDist < combinedRadiusSqr) {
        const dist = Math.sqrt(sqrDist)
        if (dist === 0) return
        const overlap = combinedRadius - dist
        const nx = scaledDx / dist
        const ny = scaledDy / dist

        if (q.fixed) {
          p.x += nx * overlap * (radiusX * 2)
          p.y += ny * overlap * (radiusY * 2)
          const relVel = p.vx * nx + p.vy * ny
          const impulse = -2 * relVel
          p.vx += impulse * nx * (p.damping / 1.5)
          p.vy += impulse * ny * p.damping
        } else if (p.fixed) {
          q.x -= nx * overlap * (radiusX * 2)
          q.y -= ny * overlap * (radiusY * 2)
          const relVel = q.vx * nx + q.vy * ny
          const impulse = -2 * relVel
          q.vx += impulse * nx * (p.damping / 1.5)
          q.vy += impulse * ny * p.damping
        } else {
          p.x += nx * overlap * 0.5 * radiusX
          p.y += ny * overlap * 0.5 * radiusY
          q.x -= nx * overlap * 0.5 * radiusX
          q.y -= ny * overlap * 0.5 * radiusY
          const relVel = (p.vx - q.vx) * nx + (p.vy - q.vy) * ny
          const impulse = (1.2 * relVel) / 2
          p.vx -= impulse * nx
          p.vy -= impulse * ny
          q.vx += impulse * nx
          q.vy += impulse * ny
        }
      }
    }

    // Process collisions within each cell and with neighboring cells.
    for (let cellY = 0; cellY < gridRows; cellY++) {
      for (let cellX = 0; cellX < gridCols; cellX++) {
        const index = cellX + cellY * gridCols
        const cellPoints = gridCells[index]
        // Check collisions within the same cell.
        for (let i = 0; i < cellPoints.length; i++) {
          for (let j = i + 1; j < cellPoints.length; j++) {
            processCollision(cellPoints[i], cellPoints[j])
          }
        }
        // Check collisions with neighboring cells.
        for (let offsetY = 0; offsetY <= 1; offsetY++) {
          for (let offsetX = offsetY === 0 ? 1 : -1; offsetX <= 1; offsetX++) {
            const nX = cellX + offsetX
            const nY = cellY + offsetY
            if (nX < 0 || nX >= gridCols || nY < 0 || nY >= gridRows) continue
            const neighborIndex = nX + nY * gridCols
            const neighborPoints = gridCells[neighborIndex]
            for (let i = 0; i < cellPoints.length; i++) {
              for (let j = 0; j < neighborPoints.length; j++) {
                processCollision(cellPoints[i], neighborPoints[j])
              }
            }
          }
        }
      }
    }
  }

  const morph = (
    from,
    to,
    { discardUnused = true, contextFilter = null } = {}
  ) => {
    // Ensure neither frame is empty.
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
    // Copy all target points into availableTargets.
    let availableTargets = to.slice()

    // First pass: For every point in the "from" frame, assign the closest available target.
    for (let i = 0; i < from.length; i++) {
      const point = from[i]
      if (contextFilter && point.context !== contextFilter) {
        continue
      }

      // If no candidates remain and discardUnused is enabled, reset the available list.
      if (availableTargets.length === 0 && discardUnused) {
        availableTargets = to.slice()
        allMarked = true
      }
      if (availableTargets.length === 0) break // No candidate available.

      // Find the candidate closest to the current "from" point.
      const candidate = findClosestPoint(point, availableTargets)
      if (!candidate) break

      // Remove the candidate from availableTargets using swap‑pop (order isn’t important).
      const index = availableTargets.findIndex((t) => t.uid === candidate.uid)
      if (index !== -1) {
        availableTargets[index] = availableTargets[availableTargets.length - 1]
        availableTargets.pop()
      }

      Object.assign(point, {
        gravity: 0,
        context: candidate.context,
        morph: {
          toPoint: candidate,
          toX: candidate.x,
          toY: candidate.y,
          fromX: point.x,
          fromY: point.y,
          fromValue: point.value,
          toValue: candidate.value,
          removeAfter: allMarked, // if we reset the available list, mark for removal
        },
      })
    }

    // Second pass: For any target points left unused, add new points into the "from" frame.
    if (!allMarked) {
      // availableTargets now holds the unused targets (the excess).
      // Prepare an array of candidate source points for matching.
      let availableFrom = from.slice()
      if (contextFilter) {
        availableFrom = availableFrom.filter((p) => p.context === contextFilter)
      }
      for (let i = 0; i < availableTargets.length; i++) {
        const targetPoint = availableTargets[i]

        // If no source candidates remain, reset availableFrom.
        if (availableFrom.length === 0) {
          availableFrom = from.slice()
        }
        const candidate = findClosestPoint(targetPoint, availableFrom)
        if (!candidate) break

        // Remove the candidate from availableFrom via swap‑pop.
        const idx = availableFrom.findIndex((f) => f.uid === candidate.uid)
        if (idx !== -1) {
          availableFrom[idx] = availableFrom[availableFrom.length - 1]
          availableFrom.pop()
        }

        const newPoint = {
          ...candidate,
          gravity: 0,
          context: targetPoint.context,
          value: candidate.value,
          morph: {
            toPoint: targetPoint,
            toX: targetPoint.x, // target position from the target point
            toY: targetPoint.y,
            fromX: candidate.x,
            fromY: candidate.y,
            fromValue: candidate.value, // starting from a blank value
            toValue: targetPoint.value,
          },
        }

        from.push(newPoint)
      }
    }
  }

  // Set gravity and damping.
  const gravitate = (points, { gravity = 3, damping = 0.85 } = {}) => {
    for (const p of points) {
      delete p.morph
      Object.assign(p, { gravity, damping })
    }
  }

  const addParagraph = ({
    text,
    width = 40,
    col = 0,
    row = 0,
    align = 'left',
    context = '',
  }) => {
    const points = []
    if (!text || !cols || !rows) return []

    // Split text into tokens. Newlines are captured as separate tokens.
    const tokens = text.split(/(\n)/)
    const lines = []
    let currentLine = []

    tokens.forEach((token) => {
      if (token === '\n') {
        // Force a new line when a newline token is encountered.
        lines.push(currentLine.join(' '))
        currentLine = []
      } else {
        // Process token that is not a newline. It might contain extra spaces,
        // so we split it into words.
        const words = token.split(/\s+/).filter((w) => w.length > 0)
        words.forEach((word) => {
          const lineLength = currentLine.join(' ').length
          // +1 accounts for the space if currentLine is not empty.
          if (lineLength + word.length + (lineLength > 0 ? 1 : 0) <= width) {
            currentLine.push(word)
          } else {
            lines.push(currentLine.join(' '))
            currentLine = [word]
          }
        })
      }
    })

    // Flush any remaining text.
    if (currentLine.length > 0) {
      lines.push(currentLine.join(' '))
    }

    // Apply alignment.
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
          for (let i = 0; i < wordsArray.length; i++) {
            justifiedLine += wordsArray[i]
            if (i < slots) {
              let spacesToAdd = spaceWidth + (i < extraSpaces ? 1 : 0)
              justifiedLine += ' '.repeat(spacesToAdd)
            }
          }
          return justifiedLine
        }
      } else {
        // Default is left-aligned.
        return line.padEnd(width, ' ')
      }
    })

    // Output each aligned line using setText.
    for (let r = 0; r < alignedLines.length; r++) {
      if (r + row >= rows) break // Stop if we exceed the available rows.
      points.push(
        ...addText({
          row: row + r,
          col,
          text: alignedLines[r].slice(0, cols - col),
          context,
        })
      )
    }
    return points
  }

  const addCanvas = ({ context = 'canvas' } = {}) => {
    const points = []
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const len = imageData.data.length
    for (let i = 0; i < len; i += 4) {
      const pixelIndex = i / 4
      const xPixel = pixelIndex % canvas.width
      const yPixel = Math.floor(pixelIndex / canvas.width)
      const [r, g, b] = imageData.data.slice(i, i + 3)
      const l = toGrayScale({ r, g, b })
      const value = getCharacterForGrayScale(l)

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
    for (const p of base) {
      const col = Math.round(p.x * cols)
      const row = Math.round(p.y * rows)
      const top = layer.find((q) => {
        return Math.round(q.x * cols) === col && Math.round(q.y * rows) === row
      })
      if (top) {
        const fromIndex = CHARS.indexOf(p.value)
        const toIndex = CHARS.indexOf(top.value)
        if (fromIndex === -1 || toIndex === -1) {
          console.log('NOT FOUND', p.value, top.value)
          p.value = top.value
        } else {
          const charIndex = Math.floor(lerp(fromIndex, toIndex, opacity))
          p.value = CHARS[charIndex]
        }
      } else if (typeof fallback === 'string') {
        p.value = fallback
      }
    }
  }

  const createPoint = ({ x, y, value, context = '' }) => {
    return {
      x: x + (Math.random() - 0.5) * DIFFUSION,
      y,
      value,
      context,
      vx: 0,
      vy: 0,
      gravity: 0,
      damping: 0.8,
      spring: 2,
      friction: 0.8,
      uid: generateUID(),
    }
  }

  const addText = ({
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
    for (let i = 0; i < text.length; i++) {
      const value = text[i]
      const index = col + i
      const x = index / cols
      const y = row / rows
      points.push(createPoint({ x, y, value, context }))
    }
    return points
  }

  return {
    render,
    morph,
    blend,
    explode,
    canvas,
    applyPhysics,
    addText,
    addParagraph,
    addCanvas,
    gravitate,
    createPoint,
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
