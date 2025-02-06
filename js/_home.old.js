import '@/styles/pages/home.css'
import grid from '@/js/grid/grid'
import { q, resize, create } from '@/js/utils/dom'
import { style } from '../utils/dom'
import { getCharacterForGrayScale, grayRamp } from '../ascii'
import { outQuad, inQuad, inCirc, outCirc, inOutCirc } from '@/js/utils/easing'
import wait from '@/js/utils/wait'
import { clone } from '../utils/object'
import animate, { lerp, reverseLerp } from '@/js/utils/animate'
import work from '@/data/work.js'
import loadimage from '@/js/utils/loadimage'

export const path = /^\/$/

export default async function homeold(app) {
  const [gridNode] = q('.grid')

  const {
    createFrame,
    canvas,
    cloneFrame,
    gravitate,
    mergeFrame,
    explode,
    render,
    morph,
    dimensions,
  } = grid(gridNode)

  const ctx = canvas.getContext('2d')

  let frame = createFrame()
  let raf
  let row = 0

  const getValue = (timestamp, duration) => {
    const t = (timestamp % duration) / duration
    return (1 - Math.cos(2 * Math.PI * t)) / 2
  }

  const aboutFrame = createFrame()

  // Track the current mouse X position.
  // (Initialize to the center of the window.)
  let mouseX = 0
  let nextMouseX = mouseX
  window.addEventListener('mousemove', (event) => {
    nextMouseX = event.clientX
  })

  let fadeIndex = 0

  const svg = await loadimage('/aino.svg')
  const scale =
    Math.min(canvas.width / svg.width, canvas.height / svg.height) / 1.5
  const logoWidth = svg.width * scale
  const logoHeight = svg.height * scale

  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.drawImage(
    svg,
    canvas.width / 2 - logoWidth / 2,
    canvas.height / 2 - logoHeight / 1.5,
    logoWidth,
    logoHeight
  )

  aboutFrame.drawCanvas()

  document.body.appendChild(canvas)

  animate({
    duration: 3000,
    easing: inQuad,
    onFrame: (n) => {
      fadeIndex = n
    },
  })

  function loop(timestamp) {
    frame.clear()
    mouseX += (nextMouseX - mouseX) * 0.01
    for (let r = 0; r < dimensions.rows; r++) {
      const timeValue = getValue(timestamp, 4000)
      const ms = timestamp + r * lerp(50, 150, timeValue)
      const mainValue = getValue(ms, 3000)
      const widthValue = getValue(timestamp, 8000)

      const width = lerp(30, dimensions.cols - 2, widthValue)
      const len = lerp(0, width, mainValue)
      const col = Math.floor(dimensions.cols / 2)

      const halfLen = Math.floor(len / 2)
      for (let i = -halfLen; i <= halfLen; i++) {
        if (col + i >= 0 && col + i < dimensions.cols) {
          // `base` runs from 0 (left edge) to 1 (right edge) along the drawn segment.
          const base = (i + halfLen) / (2 * halfLen)
          // The time-based phase is preserved.
          const phase = (timestamp + (r / 5) * lerp(10, 20, timeValue)) * 0.003

          // Compute the new dome center from the mouse.
          const mouseTarget = mouseX / window.innerWidth

          const modulated = Math.min(
            1,
            (Math.cos(
              lerp(3, -3, mouseTarget) * Math.PI * (base - mouseTarget) + phase
            ) +
              1) /
              2 +
              (1 - fadeIndex)
          )

          const charIndex = !isNaN(modulated)
            ? Math.floor(
                lerp(0, grayRamp.length - (fadeIndex < 0.95 ? 1 : 2), modulated)
              )
            : grayRamp.length - 2

          frame.createPoint({
            x: (col + i) / dimensions.cols,
            y: (row + r) / dimensions.rows,
            context: 'animation',
            value: grayRamp[charIndex],
          })
        }
      }
    }
    render(frame)
    raf = requestAnimationFrame(loop)
  }

  raf = requestAnimationFrame(loop)

  let stop

  aboutFrame.setFormattedParagraph({
    text: 'Digital first creative design agency\nBorn in Sweden, based in Scandinavia'.toUpperCase(),
    col: Math.floor(dimensions.cols / 2) - 40,
    row: Math.floor(dimensions.rows / 2) + 7,
    width: 80,
    align: 'center',
    fixed: true,
    context: 'text',
  })

  document.body.addEventListener(
    'click',
    () => {
      cancelAnimationFrame(raf)
      explode(
        frame.points.filter((p) => p.context === 'animation'),
        { spread: 0.2 }
      )
      let g = gravitate(frame, {
        gravity: 1,
      })
      stop = g.stop
      setTimeout(() => {
        morph({
          from: frame,
          to: aboutFrame,
          duration: 2000,
          easing: inCirc,
        })
        document.body.addEventListener(
          'click',
          () => {
            const newFrame = createFrame()
            newFrame.setText({
              text: 'This is it'.toUpperCase(),
              col: Math.floor(dimensions.cols / 2),
              align: 'center',
              row: Math.floor(dimensions.rows / 2),
              fixed: true,
              context: 'text',
            })

            for (const p of frame.points) {
              p.fixed = false
              delete p.morph
            }
            // explode(frame.points, { spread: 0.1 })
            // setTimeout(() => {
            morph({
              from: frame,
              to: newFrame,
              duration: 2000,
              easing: inCirc,
            })
            // }, 2000)
          },
          { once: true }
        )
      }, 1000)
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
