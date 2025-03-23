import '@/styles/pages/home.css'
import grid from '@/js/grid/grid3'
import { q } from '@/js/utils/dom'
import { inQuad } from '@/js/utils/easing'
import wait from '@/js/utils/wait'
import animate, { lerp } from '@/js/utils/animate'
import loadimage from '@/js/utils/loadimage'
import { grayRamp as asciiChars } from '@/js/ascii'
import * as detect from '../utils/detect'
import { interpolateChar } from '../grid/grid3'
import {
  inCirc,
  inOutCubic,
  inOutQuad,
  inOutQuint,
  inQuint,
  linear,
  outQuad,
} from '../utils/easing'
import { getCssVariable, id } from '../utils/dom'

export const path = /^\/$/

const grayRamp = `${asciiChars} `

export default async function home(app) {
  const [gridNode] = q('.grid', app)
  const navNode = id('nav')
  const destroyers = []

  const {
    createPoint,
    createText,
    createCanvas,
    createFromCanvas,
    gravitate,
    explode,
    render,
    morph,
    applyPhysics,
    dimensions,
    listen,
    destroy,
    createVideo,
    paintCanvas,
  } = grid(gridNode)

  const logoCanvas = createCanvas()
  const svg = await loadimage('/aino.svg')

  paintCanvas(logoCanvas, svg, { alpha: 0.25, scale: 0.7 })

  const logo = createFromCanvas(logoCanvas, {
    context: 'logo',
  })

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

  const getValue = (timestamp, duration) => {
    const t = (timestamp % duration) / duration
    return (1 - Math.cos(2 * Math.PI * t)) / 2
  }

  let clicked = false

  let main = []

  let forceWidth = null

  destroyers.push(destroy)

  const createMenu = () => {
    const col = getCssVariable('col')
    return [
      ...createText({
        col: 2,
        row: 1,
        context: 'text',
        text: 'Aino',
      }),
      ...(!detect.mobile()
        ? createText({
            col: col + 4,
            row: 1,
            context: 'text',
            text: 'Work  lab',
          })
        : []),
      ...(!detect.mobile()
        ? createText({
            col: col * 2 + 6,
            row: 1,
            context: 'text',
            text: 'About  services  careers',
          })
        : []),
      ...(detect.mobile()
        ? createText({
            col: dimensions.cols - 6,
            row: 1,
            context: 'text',
            text: 'Menu',
          })
        : createText({
            col: dimensions.cols - 9,
            row: 1,
            context: 'text',
            text: 'Contact',
          })),
    ]
  }

  let menuFade
  let menu
  let nav = createMenu()

  animate({
    duration: 1000,
    easing: outQuad,
    onFrame: (n) => {
      menuFade = n
    },
    onComplete: async () => {
      morph(menu, nav, {
        duration: 1000,
      })
      animate({
        duration: 3000,
        easing: inQuad,
        onFrame: (n) => {
          fadeIndex = n
        },
      })
    },
  })

  const video = await createVideo('/assets/work/samsoe-samsoe/samsoe.mp4')

  listen('resize', () => {
    if (menuFade === 1) {
      nav = createMenu()
    } else {
      menu = createMenu()
    }
    video.resize()
  })

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
    if (menuFade < 0.998) {
      menu = [
        ...createText({
          col: 2,
          row: 1,
          context: 'text',
          text: Array(Math.ceil((dimensions.cols - 4) * menuFade))
            .fill('X')
            .join(''),
        }),
      ]
    }
    applyPhysics(main, delta)
    applyPhysics(menu, delta)
    render(main, menu)
  })

  gridNode.addEventListener(
    'mousedown',
    async () => {
      clicked = true
      listen('frame', ({ delta }) => {
        // video.blend(main)
        // video.blend(logo)
      })
      gravitate(main, {
        gravity: 2,
        damping: 0.9,
      })
      explode(main, { spread: 0.4 })
      await wait(200)

      morph(main, logo)

      let videoFade = 0

      await wait(1400)

      video.play()
      animate({
        easing: inQuad,
        onFrame: (n) => {
          videoFade = n
        },
        duration: 4000,
      })
      let blendVideo = Date.now()
      await wait(1000)

      main = logo

      let logoScale = 0

      animate({
        easing: inQuint,
        onFrame: (n) => {
          logoScale = n
        },
        duration: 2000,
      })

      let x = undefined
      let showFinale = Date.now()

      listen('frame', ({ delta }) => {
        if (Date.now() - showFinale < 4000) {
          const { w } = paintCanvas(logoCanvas, svg, {
            alpha: 0.2,
            scale: lerp(0.7, 20, logoScale),
            x,
          })
          x = (logoCanvas.width / 2 - w / 2) * lerp(1, 0.9, logoScale)
          main = createFromCanvas(logoCanvas, {
            context: 'logo',
          })
        }
        if (Date.now() - blendVideo < 4000) {
          video.blend(main, videoFade)
        }
      })

      // listen('frame', ({ delta }) => {
      //   applyPhysics(logo, delta)
      // })
      // await wait(1200)
      // gravitate(main, {
      //   gravity: 1.8,
      //   damping: 1.005,
      // })
      // await wait(2000)

      await wait(4000)
      video.pause()
      gravitate(main, {
        damping: 0.9,
      })

      const final = createText({
        col: Math.floor(dimensions.cols / 2),
        row: Math.floor(dimensions.rows / 2),
        context: 'text',
        text: 'Aino',
      })

      await wait(1400)

      morph(main, final)

      // main.length = 0
      // main.push(...video.points)
      // explode(main)
    },
    { once: true }
  )

  return () => {
    destroyers.forEach((destroy) => destroy())
  }
}
