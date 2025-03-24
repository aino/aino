import '@/styles/pages/home.css'
import grid from '@/js/grid/grid3'
import { q, id } from '@/js/utils/dom'
import { outQuad, inQuad, inCirc, outCirc, inOutCirc } from '@/js/utils/easing'
import wait from '@/js/utils/wait'
import animate, { lerp, reverseLerp } from '@/js/utils/animate'
import work from '@/data/work.js'
import loadimage from '@/js/utils/loadimage'
import { grayRamp } from '../ascii'
import { create } from '../utils/dom'
import { CHARS, fadeChar } from '../grid/grid2'
import { inQuint } from '../utils/easing'

export const path = /^intro\/$/

const CHAR_FADE = 2000

export default async function intro(app) {
  const [gridNode] = q('.grid')
  const nav = id('nav')

  const {
    canvas,
    createPoint,
    createText,
    blend,
    createFromCanvas,
    gravitate,
    explode,
    morph,
    dimensions,
    startRenderLoop,
  } = grid(gridNode)

  const ctx = canvas.getContext('2d')
  let raf

  const svg = await loadimage('/aino.svg')
  let scale =
    Math.min(canvas.width / svg.width, canvas.height / svg.height) / 1.5
  const logoWidth = svg.width * scale
  const logoHeight = svg.height * scale * 0.5

  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.globalAlpha = 0.4
  ctx.drawImage(
    svg,
    canvas.width / 2 - logoWidth / 2,
    canvas.height / 2 - logoHeight / 1.5,
    logoWidth,
    logoHeight
  )

  const logo = createFromCanvas({
    context: 'logo',
  })

  ctx.globalAlpha = 1
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  let intro = []

  let mouseX = 0
  let dirX = 0
  let nextMouseX = null
  let mouseY = 0
  let nextMouseY = null

  const mouseGrid = []
  const setMouseGrid = (x, y) => {
    const now = Date.now()
    const col = Math.floor((x / dimensions.width) * dimensions.cols)
    const row = Math.floor((y / dimensions.height) * dimensions.rows)

    // Maximum distances you want to affect:
    //   3 columns away, 2 rows away => a possible maximum “Manhattan distance” = 3 + 2 = 5
    const maxColDistance = 4
    const maxRowDistance = 2
    const maxManhattanDistance = maxColDistance + maxRowDistance // 5

    // The desired min/max lifetimes
    const minLifetime = 10
    const maxLifetime = CHAR_FADE

    // Helper to decide if (r, c) is within the bounding box
    // This is just to limit checking to ~|3| cols and ~|2| rows
    const inRange = (r, c) =>
      c >= col - maxColDistance &&
      c <= col + maxColDistance &&
      r >= row - maxRowDistance &&
      r <= row + maxRowDistance

    for (let r = 0; r < dimensions.rows; r++) {
      if (!mouseGrid[r]) {
        mouseGrid[r] = []
      }
      for (let c = 0; c < dimensions.cols; c++) {
        // If we are within the bounding box and want to set a “lifetime”
        if (!mouseGrid[r][c] && inRange(r, c)) {
          // Calculate distance from the mouse cell
          const distance = Math.abs(r - row) + Math.abs(c - col)

          // Interpolate lifetime between minLifetime and maxLifetime
          // when distance = 0 -> lifetime = maxLifetime
          // when distance = maxManhattanDistance -> lifetime = minLifetime
          const fraction = distance / maxManhattanDistance // goes from 0..1
          const lifetime = maxLifetime - fraction * (maxLifetime - minLifetime)

          // Set the grid cell to expire at now + lifetime
          mouseGrid[r][c] = now + lifetime
        } else if (!mouseGrid[r][c] || now > mouseGrid[r][c]) {
          // Expire or clear out old values
          mouseGrid[r][c] = null
        }
      }
    }
  }

  window.addEventListener('mousemove', (event) => {
    nextMouseX = event.clientX
    nextMouseY = event.clientY
    if (!mouseX) {
      mouseX = nextMouseX
    }
    if (!mouseY) {
      mouseY = nextMouseY
    }
    setMouseGrid(nextMouseX, nextMouseY)
  })

  let fadeIndex = 0

  animate({
    duration: 3000,
    easing: inQuad,
    onFrame: (n) => {
      fadeIndex = n
    },
  })

  let textRow = Math.floor(dimensions.rows / 2 + logoHeight / 2)
  const getValue = (timestamp, duration) => {
    const t = (timestamp % duration) / duration
    return (1 - Math.cos(2 * Math.PI * t)) / 2
  }

  let clicked = false

  let main = []

  let forceWidth = null

  const addHoverEffect = (points) => {
    const now = Date.now()
    for (const p of points) {
      const col = Math.round(p.x * dimensions.cols)
      const row = Math.round(p.y * dimensions.rows)
      if (
        mouseGrid[row]?.[col] &&
        mouseGrid[row][col] > now &&
        mouseGrid[row][col] < now + CHAR_FADE
      ) {
        const t = reverseLerp(
          mouseGrid[row][col] - CHAR_FADE,
          mouseGrid[row][col],
          now
        )
        if (t < 0 || t > 1) {
          mouseGrid[row][col] = null
        } else {
          p.value = CHARS[Math.floor(lerp(0, CHARS.indexOf(p.value), t))]
        }
      }
    }
  }

  startRenderLoop(main, (delta, timestamp) => {
    intro = []
    mouseX += (nextMouseX - mouseX) * (delta / 200)
    mouseY += (nextMouseY - mouseY) * (delta / 200)
    dirX += (nextMouseX - dirX) * 0.01
    if (!clicked) {
      for (let r = 0; r < dimensions.rows; r++) {
        const timeValue = getValue(timestamp, 4000)
        const ms = timestamp + r * lerp(50, 150, timeValue)
        const mainValue = getValue(ms, 3000)
        const widthValue = getValue(timestamp, 8000)

        const width = forceWidth || lerp(30, dimensions.cols - 2, widthValue)
        const len = lerp(0, width, mainValue)
        const col = Math.floor(dimensions.cols / 2)

        const halfLen = Math.floor(len / 2)
        for (let i = -halfLen; i <= halfLen; i++) {
          if (col + i >= 0 && col + i < dimensions.cols) {
            // `base` runs from 0 (left edge) to 1 (right edge) along the drawn segment.
            const base = (i + halfLen) / (2 * halfLen)
            // The time-based phase is preserved.
            const phase =
              (timestamp + (r / 6) * lerp(10, 20, timeValue)) * 0.003

            // Compute the new dome center from the mouse.
            const mouseTarget = dirX / window.innerWidth

            const modulated = Math.min(
              1,
              (Math.cos(
                lerp(3, -3, mouseTarget) * Math.PI * (base - mouseTarget) +
                  phase
              ) +
                1) /
                2 +
                (1 - fadeIndex)
            )

            const charIndex = !isNaN(modulated)
              ? Math.floor(
                  lerp(
                    0,
                    grayRamp.length - (fadeIndex < 0.95 ? 1 : 2),
                    modulated
                  )
                )
              : grayRamp.length - 2
            const value = grayRamp[charIndex]
            if (value.trim()) {
              intro.push(
                createPoint({
                  x: (col + i) / dimensions.cols,
                  y: r / dimensions.rows,
                  context: 'animation',
                  value: fadeChar(grayRamp[charIndex], 0.5, grayRamp),
                })
              )
            }
          }
        }
      }
      main = [
        ...intro,
        ...(nextMouseX !== null && nextMouseY !== null
          ? createText({
              col:
                Math.floor((mouseX / dimensions.width) * dimensions.cols) - 2,
              row: Math.floor((mouseY / dimensions.height) * dimensions.rows),
              context: 'text',
              text: 'Click'.toUpperCase(),
            })
          : []),
      ]
      // addHoverEffect(main)
      return main
    }
  })

  logo.push(
    ...createText({
      col: Math.floor(dimensions.cols / 2),
      row: textRow,
      align: 'center',
      context: 'text',
      text: 'Digital first creative design agency'.toUpperCase(),
    })
  )

  gridNode.addEventListener(
    'mousedown',
    async () => {
      clicked = true
      gravitate(main, {
        gravity: 2,
        damping: 0.9,
      })
      explode(main, { spread: 0.4 })
      await wait(600)
      morph(main, logo)
      await wait(3000)
      morph(
        main,
        createText({
          col: Math.floor(dimensions.cols / 2),
          row: textRow,
          align: 'center',
          context: 'text',
          text: 'Lorem ipsum dorem fasit'.toUpperCase(),
        }),
        {
          contextFilter: 'text',
        }
      )
      await wait(2400)
      morph(
        main,
        [
          createPoint({
            x: 0.5,
            y: textRow / dimensions.rows,
            context: 'text',
            value: ' ',
          }),
        ],
        {
          contextFilter: 'text',
        }
      )
      await wait(800)
      explode(main, {
        spread: 0.1,
      })
      gravitate(main, {
        gravity: 1.3,
        damping: 1,
      })
      await wait(1800)

      const menu = []
      let col = 2
      const navLength = nav.children.length
      for (let i = 0; i < navLength; i++) {
        const navContainer = nav.children[i]
        const text = q('a', navContainer)
          .map((a) => a.innerText.toUpperCase())
          .join('  ')
        menu.push(
          ...createText({
            col: i === navLength - 1 ? dimensions.cols - 2 - text.length : col,
            row: 1,
            context: 'text',
            text,
          })
        )
        col += Math.floor((dimensions.cols - 4) / 4) + 1
      }
      morph(main, menu)
    },
    { once: true }
  )

  return () => {
    if (raf) {
      cancelAnimationFrame(raf)
    }
    console.log('stopping', stop)
    if (stop) {
      stop()
    }
  }
}
