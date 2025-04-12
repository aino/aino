import '@/styles/pages/home.css'
import grid from '@/js/grid/grid3'
import { q } from '@/js/utils/dom'
import { inQuad } from '@/js/utils/easing'
import { waitingList } from '@/js/utils/wait'
import animate, { lerp } from '@/js/utils/animate'
import loadimage from '@/js/utils/loadimage'
import { grayRamp as asciiChars } from '@/js/ascii'
import * as detect from '../utils/detect'
import { fadeChar, interpolateChar } from '../grid/grid3'
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
import hoverchar from '../hoverchar'

export const path = /^\/$/

const grayRamp = `${asciiChars}`

const { wait, timers } = waitingList()

export default async function home(app) {
  const [gridNode] = q('.grid', app)
  const navNode = id('nav')
  const destroyers = [
    () => {
      timers.forEach((timer) => clearTimeout(timer))
    },
  ]

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
    setOpacity,
  } = grid(gridNode)

  const logoCanvas = createCanvas()
  const svg = await loadimage('/aino.svg')

  let intro = []

  let mouseX = 0
  let dirX = 0
  let nextMouseX = null
  let mouseY = 0
  let nextMouseY = null

  const onMouseMove = (event) => {
    if (event.target.closest('.settings')) {
      return
    }
    nextMouseX = event.clientX
    nextMouseY = event.clientY
    if (!mouseX) {
      mouseX = nextMouseX
    }
    if (!mouseY) {
      mouseY = nextMouseY
    }
  }

  addEventListener('mousemove', onMouseMove)
  destroyers.push(() => removeEventListener('mousemove', onMouseMove))

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
    const points = [
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
        ? [
            ...createText({
              col: col * 2 + 6,
              row: 1,
              context: 'text',
              text: 'About  services  careers',
            }),
            ...createText({
              col: col * 3 + 8,
              row: 1,
              context: 'text',
              text: 'Settings',
            }),
          ]
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
    if (window._visited) {
      for (const p of points) {
        p.value = ' '
      }
    }
    return points
  }

  let menuFade = 0
  let menu
  let nav = createMenu()

  if (!window._visited) {
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
        await wait(1400)
        navNode.style.opacity = 1
        for (const p of menu) {
          p.value = ' '
        }
        console.log(menu)
      },
    })
  } else {
    menu = createMenu()
    animate({
      duration: 3000,
      easing: inQuad,
      onFrame: (n) => {
        fadeIndex = n
      },
    })
  }

  const video = await createVideo('/assets/reel5.mp4')

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
            if (value.trim() && fadeIndex) {
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
        fadeIndex &&
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
    if (menuFade < 0.998 && !window._visited) {
      menu = [
        ...createText({
          col: 2,
          row: 1,
          context: 'text',
          text: Array(Math.ceil((dimensions.cols - 4) * menuFade))
            .fill('=')
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
      paintCanvas(logoCanvas, svg, { alpha: 0.25, scale: 0.7 })

      const logo = createFromCanvas(logoCanvas, {
        context: 'logo',
      })

      morph(main, logo)

      let videoFade = 0

      await wait(1400)

      video.video.play()
      animate({
        easing: inQuad,
        onFrame: (n) => {
          videoFade = n
        },
        duration: 2000,
      })

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
      let videoStopped = false
      let lastClick = false

      const onVideoEnd = async () => {
        videoStopped = true
        main = main.filter((p) => p.value.trim())
        explode(main)
        gravitate(main)
        const col = getCssVariable('col')

        const finalText1 = createText({
          col: col + 4,
          row: Math.floor(dimensions.rows / 2) - 2,
          context: 'text',
          text: 'Aino.agency',
        })

        const finalText2 = createText({
          col: col * 2 + 6,
          row: Math.floor(dimensions.rows / 2) - 2,
          context: 'text',
          text: 'Design & Technology',
        })

        const final1 = createText({
          col: col + 4,
          row: Math.floor(dimensions.rows / 2) - 2,
          context: 'text',
          text: 'A',
        })
        const final2 = createText({
          col: col * 2 + 6,
          row: Math.floor(dimensions.rows / 2) - 2,
          context: 'text',
          text: 'D',
        })

        await wait(2000)

        morph(final1, finalText1, { duration: 2000 })

        main = [...main, ...final1]

        await wait(2000)
        const chars = main.map((p) => p.value)
        animate({
          easing: inOutCubic,
          onFrame: (n) => {
            for (let i = 0; i < main.length; i++) {
              main[i].value = fadeChar(chars[i], 1 - n)
            }
          },
          duration: 1300,
          onComplete: async () => {
            history.pushState({}, '', '/work')
          },
        })
      }

      const onLastClick = () => {
        lastClick = true
        videoStopped = true
        video.video.pause()
        requestAnimationFrame(() => {
          onVideoEnd()
        })
      }

      addEventListener('mousedown', onLastClick, { once: true })

      video.video.addEventListener('ended', onVideoEnd)
      destroyers.push(() => {
        removeEventListener('mousedown', onLastClick)
        video.video.removeEventListener('ended', onVideoEnd)
      })

      listen('frame', ({ delta }) => {
        if (!lastClick) {
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
          if (!videoStopped) {
            video.blend(main, videoFade)
          }
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

      // main.length = 0
      // main.push(...video.points)
      // explode(main)
    },
    { once: true }
  )

  return () => {
    window._visited = true
    destroyers.forEach((destroy) => destroy())
  }
}
