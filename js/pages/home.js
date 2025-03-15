import '@/styles/pages/home.css'
import grid from '@/js/grid/grid2'
import { q, id } from '@/js/utils/dom'
import { outQuad, inQuad, inCirc, outCirc, inOutCirc } from '@/js/utils/easing'
import wait from '@/js/utils/wait'
import animate, { lerp, reverseLerp } from '@/js/utils/animate'
import work from '@/data/work.js'
import loadimage from '@/js/utils/loadimage'
import ascii, { grayRamp as ascChars } from '../ascii'
import { create, getCssVariable, style } from '../utils/dom'
import { CHARS, fadeChar } from '../grid/grid2'
import debounce, { throttle } from '../utils/debounce'
import { smoothScroll } from '../utils/scroll'

const grayRamp = `${CHARS}`

export const path = /^\/$/

export default async function home(app) {
  const [gridNode] = q('.grid')
  const destroyers = []

  const {
    canvas,
    createPoint,
    createText,
    blend,
    addParagraph,
    createFromCanvas,
    gravitate,
    explode,
    render,
    morph,
    applyPhysics,
    dimensions,
    startRenderLoop,
    stopRenderLoop,
    listen,
    setOpacity,
  } = grid(gridNode, grayRamp)

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
    canvas.height / 2 - logoHeight / 2,
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

  const [firstSection] = q('section.start')
  let firstImages = []
  for (const img of q('img', firstSection)) {
    destroyers.push(ascii(img))
  }
  await wait(400)
  for (const asc of q('.ascii', firstSection)) {
    style(asc, {
      display: 'block',
      opacity: 0,
    })
    const line = getCssVariable('line')
    const ch = getCssVariable('ch')
    let y = 3
    const { width, height, left } = asc.getBoundingClientRect()
    const startX = Math.floor(left / ch)
    let x = startX
    const cols = Math.floor(width / ch)
    const rows = Math.floor(height / line)
    for (let i = 0; i < asc.innerText.length; i++) {
      const char = asc.innerText[i]
      if (char === '\n') {
        y++
        x = startX
      } else {
        x++
      }
      firstImages.push(
        createPoint({
          x: lerp(0, cols / dimensions.cols, x / cols),
          y: lerp(0, rows / dimensions.rows, y / rows),
          context: 'text',
          value: char,
        })
      )
    }
  }

  const getValue = (timestamp, duration) => {
    const t = (timestamp % duration) / duration
    return (1 - Math.cos(2 * Math.PI * t)) / 2
  }

  let clicked = false

  let main = []

  let forceWidth = null

  const { update } = startRenderLoop(main)

  listen('frame', ({ delta, timestamp, points }) => {
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
      update(main)
    }
  })

  let opacity = 1

  listen('render', (points) => {
    for (const p of points) {
      p.filter = (value) => {
        let nextChar = value
        if (p.context !== 'text') {
          const index = CHARS.indexOf(value)
          const n = index / CHARS.length
          nextChar = ascChars[Math.floor(n * ascChars.length)]
          return fadeChar(nextChar, opacity, ascChars)
        }
        return fadeChar(nextChar, opacity, CHARS)
      }
    }
  })

  /*

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
                  value: grayRamp[charIndex],
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
      return main
    }
  })

  */

  // logo.push(
  //   ...createText({
  //     col: Math.floor(dimensions.cols / 2),
  //     row: textRow,
  //     align: 'center',
  //     context: 'text',
  //     text: 'Digital first creative design agency'.toUpperCase(),
  //   })
  // )

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
      await wait(2400)
      gravitate(main, {
        gravity: 1.8,
        damping: 1.005,
      })
      await wait(1600)
      morph(main, [
        ...createText({
          col: Math.floor(dimensions.cols / 2),
          row: Math.floor(dimensions.rows / 2) - 2,
          context: 'text',
          text: 'Scandinavian Design & Technology Agency'.toUpperCase(),
          align: 'center',
        }),
      ])
      await wait(2200)
      /*
      for (const p of main) {
        p.vx = lerp(-0.3, 0.3, Math.random())
      }

      morph(main, [
        ...createText({
          col: Math.floor(dimensions.cols / 2),
          row: Math.floor(dimensions.rows / 2) - 2,
          context: 'text',
          text: ' '.toUpperCase(),
          align: 'center',
        }),
      ])
      await wait(1400)
      */
      morph(main, firstImages)

      await wait(2000)

      //scrollTo(0, innerHeight + getCssVariable('line'))

      // await wait(1600)
      // morph(main, [
      //   ...createText({
      //     col: getCssVariable('col') + 4,
      //     row: Math.floor(dimensions.rows / 2) - 2,
      //     context: 'text',
      //     text: 'Design'.toUpperCase(),
      //   }),
      //   ...createText({
      //     col: getCssVariable('col') * 2 + 6,
      //     row: Math.floor(dimensions.rows / 2) - 2,
      //     context: 'text',
      //     text: 'Technology'.toUpperCase(),
      //   }),
      // ])
      // await wait(2400)
      // morph(
      //   main,
      //   [
      //     createPoint({
      //       x: 0.5,
      //       y: textRow / dimensions.rows,
      //       context: 'text',
      //       value: ' ',
      //     }),
      //   ],
      //   {
      //     contextFilter: 'text',
      //   }
      // )
      // await wait(800)
      //explode(main, {
      //  spread: 1,
      //})
      // gravitate(main, {
      //   gravity: 1,
      //   damping: 0.8,
      // })
      // await wait(1800)
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
