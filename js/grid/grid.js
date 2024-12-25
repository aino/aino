import { getCssVariable } from '@/js/utils/dom'
import { insertEvery } from '@/js/utils/array'

/** Gravity constant affecting point movement. */
const gravity = 0.0002
/** Damping constant to simulate friction. */
const damping = 0.85
/** Diffusion constant for random motion. */
const diffusion = 0.000001

/**
 * @typedef {Object} GridAPI
 * @property {function(Object): void} createPoint - Adds a point to the grid.
 * @property {function(number, number, string): void} setText - Sets text at a specific position in the grid.
 * @property {function(): string} getText - Retrieves the current grid as a string.
 * @property {function(): void} resize - Recalculates the grid's dimensions.
 * @property {number} cols - The number of columns in the grid.
 * @property {number} rows - The number of rows in the grid.
 * @property {string[]} textArr - The grid's text array representation.
 * @property {function(): void} update - Updates the grid by applying physics.
 */

/**
 * Creates and manages a grid with dynamic points.
 * @param {HTMLElement} node - The DOM node to attach the grid to.
 * @returns {GridAPI} An API to interact with the grid.
 */

export default function grid(node) {
  let points = [],
    width,
    height,
    rem,
    line,
    cols,
    rows,
    textArr = []

  /**
   * Initializes or recalculates grid variables based on the DOM node dimensions.
   */
  const setVariables = () => {
    rem = getCssVariable('rem')
    line = rem * 2
    const rect = node.getBoundingClientRect()
    width = rect.width
    height = rect.height
    cols = Math.round(width / rem)
    rows = Math.round(height / line)
    const length = rows * cols
    if (length != textArr.length) {
      textArr = Array.from({ length: rows * cols }).fill(' ')
    }
  }
  setVariables()

  /**
   * Creates a point in the grid.
   * @param {Object} options - Point configuration options.
   * @param {number} options.x - X-coordinate (normalized between 0 and 1).
   * @param {number} options.y - Y-coordinate (normalized between 0 and 1).
   * @param {string} options.value - The value associated with the point.
   * @param {boolean} [options.fixed=false] - Whether the point is fixed in position.
   */
  const createPoint = ({ x, y, value, fixed = false }) => {
    points.push({
      x,
      y,
      value,
      fixed,
      vx: 0,
      vy: 0,
      mass: 1,
    })
  }

  /**
   * Generates the grid's textual representation based on point values.
   * @returns {string} The textual representation of the grid.
   */
  const getText = () => {
    textArr.fill(' ')

    const processPoints = (filterCondition) => {
      points.filter(filterCondition).forEach(({ x, y, value }) => {
        const col = Math.round(x * cols)
        const row = Math.round(y * rows)
        if (row < rows && col < cols) {
          textArr[cols * row + col] = value
        }
      })
    }

    processPoints(({ fixed }) => !fixed)
    processPoints(({ fixed }) => fixed)

    return insertEvery(textArr, '\n', cols).join('')
  }

  /**
   * Sets text at a specific position in the grid.
   * @param {number} row - The row index.
   * @param {number} col - The column index.
   * @param {string} value - The text to set at the position.
   */
  const setText = ({ row = 0, col = 0, value, fixed = false }) => {
    if (!value) {
      return
    }
    const startIndex = row * cols + col
    for (let i = 0; i < value.length; i++) {
      const index = startIndex + i,
        r = Math.floor(index / cols),
        c = index % cols
      if (r >= rows) break
      const x = c / cols,
        y = r / rows
      const existing = points.findIndex(
        (p) => Math.round(p.x * cols) === c && Math.round(p.y * rows) === r
      )
      existing !== -1
        ? (points[existing].value = value[i])
        : points.push({
            x,
            y,
            value: value[i],
            vx: 0,
            vy: 0,
            fixed,
            mass: 1,
          })
      textArr[index] = value[i]
    }
  }

  const update = () => {
    const radiusX = 0.1 / cols // Horizontal radius based on grid width
    const radiusY = 0.2 / rows // Vertical radius is twice the horizontal radius

    for (let i = 0; i < points.length; i++) {
      const p = points[i]

      // Skip fixed points for position updates
      if (p.fixed) continue

      // Apply gravity and diffusion
      p.vy += gravity
      p.vx += (Math.random() - 0.5) * diffusion
      p.vy += (Math.random() - 0.5) * diffusion

      // Update position
      p.x += p.vx
      p.y += p.vy

      // Boundary collisions
      if (p.x <= 0 || p.x >= 1) {
        p.vx *= -damping
        p.x = Math.max(0, Math.min(1, p.x))
      }
      if (p.y >= 1) {
        p.vy *= -damping
        p.y = 1
      }
      if (p.y <= 0) {
        p.vy *= -damping
        p.y = 0
      }

      // Check collisions with other points
      for (let j = 0; j < points.length; j++) {
        if (i === j) continue

        const q = points[j]
        const dx = p.x - q.x
        const dy = p.y - q.y

        // Adjust distance calculation to account for anisotropic radius
        const scaledDx = dx / radiusX
        const scaledDy = dy / radiusY
        const dist = Math.sqrt(scaledDx * scaledDx + scaledDy * scaledDy)

        // Collision detection using anisotropic combined radius
        const combinedRadius = 2 // Scaled radii sum as normalized to 1
        if (dist < combinedRadius) {
          const overlap = combinedRadius - dist
          const nx = scaledDx / dist
          const ny = scaledDy / dist

          if (q.fixed) {
            // Bounce off the static point, no changes to `q` position
            p.x += nx * overlap * radiusX
            p.y += ny * overlap * radiusY
            const relVel = p.vx * nx + p.vy * ny
            const impulse = -2 * relVel
            p.vx += impulse * nx * damping // Reflect with damping
            p.vy += impulse * ny * damping
          } else {
            // Handle regular collision between movable points
            const qXBefore = q.x // Save q.x before changes
            const qYBefore = q.y // Save q.y before changes

            p.x += nx * overlap * 0.5 * radiusX
            p.y += ny * overlap * 0.5 * radiusY
            q.x -= nx * overlap * 0.5 * radiusX
            q.y -= ny * overlap * 0.5 * radiusY

            // Revert q position if fixed
            if (q.fixed) {
              q.x = qXBefore
              q.y = qYBefore
            }

            const relVel = (p.vx - q.vx) * nx + (p.vy - q.vy) * ny
            const impulse = (1.2 * relVel) / (p.mass + q.mass)
            p.vx -= impulse * nx * q.mass
            p.vy -= impulse * ny * q.mass
            q.vx += impulse * nx * p.mass
            q.vy += impulse * ny * p.mass
          }
        }
      }
    }

    // Update grid text
    node.textContent = getText()
  }

  /**
   * Formats and sets a paragraph of text into the grid.
   * @param {string} text - The text to format into the grid.
   * @param {number} width - The fixed width of each line in columns.
   * @param {string} alignment - Alignment of the text ('left' or 'justify').
   */
  const setFormattedParagraph = ({
    text,
    width = 100,
    alignment = 'left',
    x = 0,
    y = 0,
    fixed = false,
  }) => {
    const words = text.split(/\s+/)
    const lines = []
    let currentLine = []

    // Break text into lines based on the width
    words.forEach((word) => {
      const lineLength = currentLine.join(' ').length
      if (lineLength + word.length + (lineLength > 0 ? 1 : 0) <= width) {
        currentLine.push(word)
      } else {
        lines.push(currentLine.join(' '))
        currentLine = [word]
      }
    })
    if (currentLine.length > 0) {
      lines.push(currentLine.join(' '))
    }

    // Apply alignment to each line
    const alignedLines = lines.map((line) => {
      if (alignment === 'justify' && line.length < width) {
        const gaps = line.split(' ').length - 1
        if (gaps > 0) {
          const extraSpaces = width - line.length
          const spaceArray = Array(gaps).fill(
            1 + Math.floor(extraSpaces / gaps)
          )
          let remainder = extraSpaces % gaps
          for (let i = 0; i < remainder; i++) {
            spaceArray[i]++
          }
          const words = line.split(' ')
          return words
            .map((word, i) =>
              i < gaps ? word + ' '.repeat(spaceArray[i]) : word
            )
            .join('')
        }
      }
      return line.padEnd(width, ' ') // Left align by default
    })

    // Set the formatted lines into the grid
    alignedLines.forEach((line, row) => {
      setText(row + y, x, line, fixed) // Use `setText` to set each line in the grid
    })
  }

  return {
    createPoint,
    setText,
    setFormattedParagraph,
    getText,
    resize: setVariables,
    cols,
    rows,
    textArr,
    update,
    points,
  }
}
