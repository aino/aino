import '@/styles/pages/home.css'
import grid from '@/js/grid/grid2'
import { q, id } from '@/js/utils/dom'
import { outQuad, inQuad, inCirc, outCirc, inOutCirc } from '@/js/utils/easing'
import wait from '@/js/utils/wait'
import animate, { lerp, reverseLerp } from '@/js/utils/animate'
import work from '@/data/work.js'
import loadimage from '@/js/utils/loadimage'
import { grayRamp } from '../ascii'

export const path = /^\/$/

export default async function home(app) {
  const [gridNode] = q('.grid')
  const nav = id('nav')
  nav.style.opacity = '0'

  const {
    canvas,
    createPoint,
    addText,
    blend,
    addParagraph,
    addCanvas,
    gravitate,
    explode,
    render,
    morph,
    applyPhysics,
    dimensions,
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
  ctx.globalAlpha = 0.2
  ctx.drawImage(
    svg,
    canvas.width / 2 - logoWidth / 2,
    canvas.height / 2 - logoHeight / 1.5,
    logoWidth,
    logoHeight
  )

  document.body.appendChild(canvas)

  const logo = addCanvas({
    context: 'logo',
  })

  const office = await loadimage('/images/office.jpg')
  ctx.globalAlpha = 1
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  scale = Math.max(
    (canvas.width - 4) / 2 / office.width,
    (canvas.height - 4) / office.height
  )
  ctx.drawImage(office, 2, 3, office.width * scale, (office.height * scale) / 2)

  const officePoints = addCanvas()

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

  let textRow = Math.floor(dimensions.rows / 2 + logoHeight / 2)
  const getValue = (timestamp, duration) => {
    const t = (timestamp % duration) / duration
    return (1 - Math.cos(2 * Math.PI * t)) / 2
  }

  let then = Date.now()

  let clicked = false

  let main = []

  let forceWidth = null

  function loop(timestamp) {
    intro = []
    mouseX += (nextMouseX - mouseX) * 0.03
    mouseY += (nextMouseY - mouseY) * 0.03
    dirX += (nextMouseX - dirX) * 0.01
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
          const phase = (timestamp + (r / 6) * lerp(10, 20, timeValue)) * 0.003

          // Compute the new dome center from the mouse.
          const mouseTarget = dirX / window.innerWidth

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

    const now = Date.now()

    if (!clicked) {
      main = [
        ...intro,
        ...(nextMouseX !== null && nextMouseY !== null
          ? addText({
              col:
                Math.floor((mouseX / dimensions.width) * dimensions.cols) - 2,
              row: Math.floor((mouseY / dimensions.height) * dimensions.rows),
              context: 'text',
              text: 'Click'.toUpperCase(),
            })
          : []),
      ]
    }
    applyPhysics(main, now - then)
    render(main)
    then = now
    raf = requestAnimationFrame(loop)
  }

  raf = requestAnimationFrame(loop)

  logo.push(
    ...addText({
      col: Math.floor(dimensions.cols / 2),
      row: textRow,
      align: 'center',
      context: 'text',
      text: 'Digital first creative design agency'.toUpperCase(),
    })
  )

  document.body.addEventListener(
    'click',
    async () => {
      clicked = true
      gravitate(main, {
        gravity: 1,
        damping: 1,
      })
      explode(main, { spread: 0.4 })
      await wait(700)
      morph(main, logo)
      await wait(3000)
      morph(
        main,
        addText({
          col: Math.floor(dimensions.cols / 2),
          row: textRow,
          align: 'center',
          context: 'text',
          text: 'Born in Sweden · based in Scandinavia · Operating worldwide'.toUpperCase(),
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
      await wait(600)
      explode(main, {
        spread: 1,
      })
      gravitate(main, {
        gravity: 1,
        damping: 0.9,
      })
      await wait(400)

      // await wait(1000)
      const menu = [
        ...addText({
          col: 2,
          row: 1,
          context: 'text',
          text: 'Aino Work About'.toUpperCase(),
        }),
        ...addText({
          col: dimensions.cols - 29,
          row: 1,
          context: 'text',
          text: 'Studio life careers contact'.toUpperCase(),
        }),
      ]
      // menu.push(...officePoints)
      morph(main, menu)

      // gravitate(main)
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
