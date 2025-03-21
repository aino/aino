import '@/styles/pages/home.css'
import grid from '@/js/grid/grid3'
import { q } from '@/js/utils/dom'
import { inQuad } from '@/js/utils/easing'
import wait from '@/js/utils/wait'
import animate, { lerp } from '@/js/utils/animate'
import loadimage from '@/js/utils/loadimage'
import { grayRamp } from '@/js/ascii'
import * as detect from '../utils/detect'

export const path = /^\/$/

export default async function home(app) {
  const [gridNode] = q('.grid', app)
  const destroyers = []

  const {
    canvas,
    createPoint,
    createText,
    createFromCanvas,
    gravitate,
    explode,
    render,
    morph,
    applyPhysics,
    dimensions,
    listen,
    destroy,
  } = grid(gridNode)

  const ctx = canvas.getContext('2d')

  const svg = await loadimage('/aino.svg')
  let scale =
    Math.min(canvas.width / svg.width, canvas.height / svg.height) /
    (detect.mobile() ? 1.1 : 1.5)
  const logoWidth = svg.width * scale
  const logoHeight = svg.height * scale * 0.5

  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.globalAlpha = 0.4
  ctx.drawImage(
    svg,
    canvas.width / 2 - logoWidth / 2,
    logoHeight / 2,
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

  window.addEventListener('mousemove', (event) => {
    nextMouseX = event.clientX
    nextMouseY = event.clientY
    if (!mouseX) {
      mouseX = nextMouseX
    }
    if (!mouseY) {
      mouseY = nextMouseY
    }
  })

  let fadeIndex = 0

  animate({
    duration: 3000,
    easing: inQuad,
    onFrame: (n) => {
      fadeIndex = n
    },
  })

  const getValue = (timestamp, duration) => {
    const t = (timestamp % duration) / duration
    return (1 - Math.cos(2 * Math.PI * t)) / 2
  }

  let clicked = false

  let main = []

  let forceWidth = null

  destroyers.push(destroy)

  listen('frame', ({ delta, timestamp }) => {
    mouseX += (nextMouseX - mouseX) * (delta / 200)
    mouseY += (nextMouseY - mouseY) * (delta / 200)
    dirX += (nextMouseX - dirX) * 0.01
    intro = []
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
                  value: grayRamp[charIndex],
                })
              )
            }
          }
        }
      }
      main = [
        ...intro,
        ...(nextMouseX !== null &&
        nextMouseY !== null &&
        Math.floor((mouseY / dimensions.height) * dimensions.rows) > 2
          ? createText({
              col:
                Math.floor((mouseX / dimensions.width) * dimensions.cols) - 2,
              row: Math.floor((mouseY / dimensions.height) * dimensions.rows),
              context: 'text',
              text: 'Click'.toUpperCase(),
            })
          : []),
      ]
    }
    applyPhysics(main, delta)
    render(main)
  })

  gridNode.addEventListener(
    'mousedown',
    async () => {
      clicked = true
      gravitate(main, {
        gravity: 2,
        damping: 0.9,
      })
      explode(main, { spread: 0.4 })
      await wait(400)
      gravitate(logo, {
        gravity: 1.1,
        damping: 1.2,
      })
      morph(main, logo)
      await wait(900)
      listen('frame', ({ delta }) => {
        applyPhysics(logo, delta)
      })
      await wait(1200)
      gravitate(main, {
        gravity: 1.8,
        damping: 1.005,
      })
      const texts = [
        ...createText({
          col: 2,
          row: Math.floor(dimensions.rows / 2) - 2,
          context: 'text',
          align: 'center',
          text: 'Ditigal first creative design agency'.toUpperCase(),
        }),
      ]
      listen('frame', ({ delta }) => {
        applyPhysics(texts, delta)
      })
      morph(main, texts)
      await wait(2000)
      // explode(main)
    },
    { once: true }
  )

  return () => {
    destroyers.forEach((destroy) => destroy())
  }
}
