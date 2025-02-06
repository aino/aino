import { getCssVariable } from '@/js/utils/dom'
import { insertEvery } from '@/js/utils/array'
import animate, { lerp } from '@/js/utils/animate'
import { getCharacterForGrayScale, grayRamp } from '../ascii'
import { linear } from '@/js/utils/easing'

// Diffusion constant for random motion.
const diffusion = 0.001

// The character set for ASCII rendering.
const chars = `$MBNQW@&R8GD6S9OH#E5UK0A2XP34ZC%VIF17YTJL[]?}{()<>|=+\\/^!";*_:~,'-.·\` `
/**
 * Find the closest point (or a fallback) in `toPoints` matching a given point.
 */
function findClosestPoint(target, points) {
  let minDist = Infinity
  let closest = null
  let allUsed = true
  let allMarked = true
  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    if (p.marked) {
      allMarked = false
      break
    }
    if (p.used) {
      allUsed = false
      break
    }
  }

  // Loop over each candidate point.
  for (let i = 0; i < points.length; i++) {
    const p = points[i]

    // Skip points that have been marked or already used.
    if ((p.used && !allUsed) || (p.marked && !allMarked)) {
      continue
    }

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

/**
 * The main grid module.
 */
export default function grid(node) {
  let width,
    height,
    rem,
    line,
    cols,
    rows,
    textArr = []

  // Create an offscreen canvas (used by drawCanvas)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  /**
   * Render the current frame’s points into the node.
   */
  const render = (frame) => {
    window._frame = frame
    textArr.fill(' ')
    // Render non‑fixed points first, then fixed points (so fixed ones are on top)
    const processPoints = (filterCondition) => {
      for (let i = 0; i < frame.points.length; i++) {
        const point = frame.points[i]
        if (filterCondition(point)) {
          if (point.context === 'text') {
            // console.log(point.value, point.y)
          }
          const col = Math.round(point.x * cols)
          const row = Math.round(point.y * rows)
          let value = point.value
          if (/^\s$/.test(value)) {
            value = ' '
          }
          if (row < rows && col < cols) {
            textArr[cols * row + col] = value
          }
        }
      }
    }
    processPoints((p) => !p.fixed)
    processPoints((p) => p.fixed)
    node.textContent = insertEvery(textArr, '\n', cols).join('')
  }

  window._render = render

  /**
   * Give all points an explosion-like kick.
   */
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
      p.fixed = false
    }
  }

  let loopFunction = null
  let raf

  const startLoop = () => {
    let now = Date.now()
    raf = requestAnimationFrame(function loop() {
      if (loopFunction) {
        const then = Date.now()
        loopFunction(then - now)
        now = then
        raf = requestAnimationFrame(loop)
      } else {
        console.log('END')
      }
    })
  }

  /**
   * Update point positions with gravity, boundaries, and collisions.
   *
   * This version uses a preallocated spatial grid (with numeric indices)
   * and plain for‑loops to reduce overhead.
   */
  const gravitate = (frame, { gravity = 3, damping = 0.85 } = {}) => {
    let spring = 1.2 // stiffness: how strongly the point is pulled to its destination
    let friction = 0.8
    loopFunction = (delta) => {
      // Use a fixed time step (in seconds) for stability.
      const dt = Math.min(0.1, delta / 1000)
      const floor = (rows - 1) / rows
      const radiusX = 0.05 / cols
      const radiusY = 0.1 / rows
      const combinedRadius = 8
      const combinedRadiusSqr = combinedRadius * combinedRadius

      // Update velocities and positions.
      let log = false
      for (let i = 0; i < frame.points.length; i++) {
        const p = frame.points[i]

        if (p.morph) {
          // Calculate the differences to the target.
          const dx = p.morph.toX - p.x
          const dy = p.morph.toY - p.y

          // If not close enough, keep animating.
          if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
            // Compute the spring-like acceleration.
            const ax = dx * spring
            const ay = dy * spring

            // Update velocities (with damping).
            p._vx = (p.vx + ax) * friction
            p._vy = (p.vy + ay) * friction

            // --- Compute the progress of the morph ---
            // Linear distance left to travel.
            const currentDistance = Math.sqrt(dx * dx + dy * dy)
            // Total distance from starting point to target.
            const totalDistance = Math.sqrt(
              Math.pow(p.morph.toX - p.morph.fromX, 2) +
                Math.pow(p.morph.toY - p.morph.fromY, 2)
            )

            // progress = 0 at the start, 1 at the finish.
            let progress = 1 - currentDistance / totalDistance
            progress = Math.max(0, Math.min(1, progress)) // clamp to [0, 1]

            p.vx += (p._vx - p.vx) / lerp(1, 20, 1 - progress)
            p.vy += (p._vy - p.vy) / lerp(1, 20, 1 - progress)

            // Update positions.
            p.x += p.vx * dt
            p.y += p.vy * dt

            // --- Fade the character ---
            // Make sure that both the from and to values are in chars.
            const fromIndex = chars.indexOf(p.morph.fromValue)
            const toIndex = chars.indexOf(p.morph.toValue)
            if (fromIndex === -1 || toIndex === -1) {
              // Fallback if one of the characters isn’t found.
              p.value = p.morph.toValue
            } else {
              // Interpolate between fromIndex and toIndex.
              const charIndex = Math.floor(lerp(fromIndex, toIndex, progress))
              p.value = chars[charIndex]
            }
          } else {
            // Once the point is close enough to its destination, snap it in place.
            p.x = p.morph.toX
            p.y = p.morph.toY
            const ty = p.y
            p.vx = 0
            p.vy = 0
            p.value = p.morph.toValue // ensure the final character is the target value
            p.fixed = true
            delete p.morph
          }
          continue // Skip the rest of the update for morphed points.
        }

        if (Math.abs(p.vy) < 0.0001 && p.y >= 0.95) {
          frame.points.splice(i, 1)
        }

        if (p.fixed) continue

        p.vy += gravity * dt
        p.x += p.vx * dt
        p.y += p.vy * dt

        if (p.x <= 0 || p.x >= 1) {
          p.vx *= -damping
          p.x = Math.max(0, Math.min(1, p.x))
        }
        if (p.y >= floor) {
          p.vy *= -damping
          p.y = floor
        }
        if (p.y <= 0) {
          p.vy *= -damping
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
      for (let i = 0; i < frame.points.length; i++) {
        const p = frame.points[i]
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
            p.vx += impulse * nx * (damping / 1.5)
            p.vy += impulse * ny * damping
          } else if (p.fixed) {
            q.x -= nx * overlap * (radiusX * 2)
            q.y -= ny * overlap * (radiusY * 2)
            const relVel = q.vx * nx + q.vy * ny
            const impulse = -2 * relVel
            q.vx += impulse * nx * (damping / 1.5)
            q.vy += impulse * ny * damping
          } else {
            p.x += nx * overlap * 0.5 * radiusX
            p.y += ny * overlap * 0.5 * radiusY
            q.x -= nx * overlap * 0.5 * radiusX
            q.y -= ny * overlap * 0.5 * radiusY
            const relVel = (p.vx - q.vx) * nx + (p.vy - q.vy) * ny
            const impulse = (1.2 * relVel) / (p.mass + q.mass)
            p.vx -= impulse * nx * q.mass
            p.vy -= impulse * ny * q.mass
            q.vx += impulse * nx * p.mass
            q.vy += impulse * ny * p.mass
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
            for (
              let offsetX = offsetY === 0 ? 1 : -1;
              offsetX <= 1;
              offsetX++
            ) {
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
      render(frame)
    }
    startLoop()
    return {
      stop: () => {
        loopFunction = null
      },
    }
  }

  /**
   * Morph (interpolate) one frame into another.
   */
  const morph = ({ from, to, duration = 1000, easing = linear }) =>
    new Promise((resolve) => {
      ;[to, from].forEach((frame) => {
        if (!frame.points.length) {
          console.warn('Empty frame, creating default points')
          frame.createPoint({
            x: 0.5,
            y: 0.5,
            value: ' ',
          })
        }
      })
      for (let i = 0; i < from.points.length; i++) {
        const point = from.points[i]
        const closest = findClosestPoint(point, to.points)
        if (closest) {
          closest.marked = true
          Object.assign(point, {
            fixed: false,
            morph: {
              toX: closest.x,
              toY: closest.y,
              fromY: point.y,
              fromX: point.x,
              fromValue: point.value,
              toValue: closest.value,
            },
          })
        }
      }
      to.points
        .filter((p) => !p.marked)
        .forEach((p) => {
          // Find the closest available point from the 'from' set.
          const closest = findClosestPoint(p, from.points)

          if (closest) {
            // Mark the chosen 'from' point as used so it won't be reused.
            // closest.used = true
            // Optionally, mark the 'to' point as processed if you don't need it later.
            // p.marked = true

            // Create a new point that holds the morphing information.
            // We use the coordinates from the closest 'from' point, but record both the original
            // (from the 'closest' candidate) and target (from the 'to' point) values.
            const newPoint = {
              ...p, // copy properties from the 'to' point
              x: closest.x, // starting x (from the matched 'from' point)
              y: closest.y, // starting y (from the matched 'from' point)
              fixed: false,
              value: ' ',
              morph: {
                toX: p.x, // target x (from the 'to' point)
                toY: p.y, // target y (from the 'to' point)
                fromX: closest.x, // starting x (from the 'from' point)
                fromY: closest.y, // starting y (from the 'from' point)
                fromValue: ' ',
                toValue: p.value,
              },
            }

            // Add the newly created morphed point into the 'from.points' array.
            from.points.push(newPoint)
            window._points = from.points.filter((p) => p.context === 'text')
          } else {
            console.warn('No available closest point found for to point:', p)
          }
        })
      /*
          
      let spring = 0.5 // stiffness: how strongly the point is pulled to its destination
      let friction = 0.9 // damping: reduces the velocity each frame
      loopFunction = (delta) => {
        const dt = Math.min(0.1, delta / 1000) // dt in seconds
        let allReached = true
        for (let i = 0; i < clone.points.length; i++) {
          const p = clone.points[i]
          // Calculate the difference to the destination.
          const dx = p.toX - p.x
          const dy = p.toY - p.y
          // Compute acceleration proportional to the distance (a spring-like force)
          const ax = dx * spring
          const ay = dy * spring
          // Update velocities with acceleration and then apply damping.
          p.vx = (p.vx + ax) * friction
          p.vy = (p.vy + ay) * friction
          // Update positions using the velocity.
          p.x += p.vx * dt
          p.y += p.vy * dt
          // If the point is still a little away from its destination, keep animating.
          if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
            allReached = false
          } else {
            // Snap to the destination when close enough.
            p.x = p.toX
            p.y = p.toY
          }
        }
        render(clone)
        // Stop the animation when all points have reached their destination.
        if (allReached) {
          loopFunction = null
          resolve()
        }
      }
      return {
        stop: () => {
          cancelAnimationFrame(raf)
        },
      }
      /*
      animate({
        duration,
        easing,
        onFrame: (n) => {
          for (let i = 0; i < clone.points.length; i++) {
            const point = clone.points[i]
            point.x = lerp(point.fromX, point.toX, n)
            point.y = lerp(point.fromY, point.toY, n)
            const ch = point.context === 'canvas' ? grayRamp : chars
            const charIndex = Math.max(
              0,
              Math.round(
                lerp(ch.indexOf(point.fromValue), ch.indexOf(point.toValue), n)
              )
            )
            point.value = ch[charIndex]
          }
          render(clone)
        },
        onComplete: () => {
          render(to)
          resolve()
        },
      })
        */
    })

  /**
   * Create a frame of points.
   */
  const createFrame = () => {
    let points = []

    const createPoint = ({ x, y, value, fixed = false, context = '' }) => {
      if (value === ' ') return
      if (x < 0 || x > 1 || y < 0 || y > 1) {
        console.warn('Point out of bounds', { x, y })
        return
      }
      points.push({
        x: x + (Math.random() - 0.5) * diffusion,
        y,
        value,
        fixed,
        vx: 0,
        vy: 0,
        mass: 1,
        context,
      })
    }

    const mergeWith = (frame) => {
      for (let i = 0; i < frame.points.length; i++) {
        points.push(frame.points[i])
      }
    }

    const setText = ({
      row = 0,
      col = 0,
      text,
      context = '',
      fixed = false,
      align = 'left',
    }) => {
      if (!text) return
      if (align === 'center') {
        col = Math.floor((cols - text.length) / 2)
      }
      for (let i = 0; i < text.length; i++) {
        const value = text[i]
        const index = col + i
        const x = index / cols
        const y = row / rows
        createPoint({ x, y, value, fixed, context })
      }
    }

    const setFormattedParagraph = ({
      text,
      width = cols,
      align = 'left',
      col = 0,
      row = 0,
      context = '',
      fixed,
    }) => {
      if (!text || !cols || !rows) return

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
        setText({
          row: row + r,
          col,
          text: alignedLines[r].slice(0, cols - col),
          context,
          fixed,
        })
      }
    }

    const drawCanvas = () => {
      // Remove any previous canvas points
      points = points.filter((p) => p.context !== 'canvas')
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      // Because you're iterating y in steps of 2,
      // the effective image height in grid coordinates is (canvas.height / 2) divided by rows.
      // (In your grid, canvas.height is set to rows.)
      const effectiveHeight = canvas.height / 2 / rows // normally 0.5
      // Compute the vertical offset needed to center the effective image in [0, 1].
      const verticalOffset = (1 - effectiveHeight) / 2 // normally (1 - 0.5)/2 = 0.25

      // Iterate over y in steps of 2
      for (let y = 0; y < canvas.height; y += 2) {
        // For each row, iterate over all columns
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4
          const r = imageData.data[i]
          const g = imageData.data[i + 1]
          const b = imageData.data[i + 2]
          const l = Math.round((r + g + b) / 3)
          const char = getCharacterForGrayScale(l)

          if (char.trim() && l !== 255) {
            createPoint({
              x: x / cols,
              // Adjust the y coordinate by adding the vertical offset
              y: y / 2 / rows + verticalOffset * 0.99,
              value: char,
              context: 'canvas',
            })
          }
        }
      }
    }

    const randomize = (spread = 1) => {
      for (let i = 0; i < points.length; i++) {
        let p = points[i]
        p.x = lerp(p.x, Math.random(), spread)
        p.y = lerp(p.y, Math.random(), spread)
      }
    }

    return {
      createPoint,
      drawCanvas,
      setText,
      setFormattedParagraph,
      mergeWith,
      clear: () => {
        points = []
      },
      get points() {
        return points
      },
      set points(p) {
        points = p
      },
      randomize,
    }
  }

  /**
   * Clone a frame (deep-copy all its points).
   */
  const cloneFrame = (frame) => {
    const newFrame = createFrame()
    newFrame.points = frame.points.map((p) => ({ ...p }))
    return newFrame
  }

  /**
   * Set up or recalculate grid variables based on the node’s dimensions.
   */
  const setVariables = () => {
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

  new ResizeObserver(() => setVariables()).observe(node)
  setVariables()

  return {
    render,
    morph,
    createFrame,
    cloneFrame,
    gravitate,
    explode,
    canvas,
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
