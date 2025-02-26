import '@/styles/pages/home.css'
import grid from '@/js/grid/grid2'
import { q, id, create } from '@/js/utils/dom'
import { outQuad, inQuad, inCirc, outCirc, inOutCirc } from '@/js/utils/easing'
import wait from '@/js/utils/wait'
import animate, { lerp, reverseLerp } from '@/js/utils/animate'
import work from '@/data/work.js'
import loadimage from '@/js/utils/loadimage'
import { grayRamp } from '../ascii'
import { CHARS, fadeChar } from '../grid/grid2'
import { inQuint } from '../utils/easing'
import ThreeBody from '../threebody'

export const path = /^\/$/

const CHAR_FADE = 2000

export default async function home(app) {
  const [gridNode] = q('.grid')
  const nav = id('nav')

  const {
    canvas,
    createPoint,
    createText,
    blend,
    paintCanvas,
    createFromCanvas,
    gravitate,
    explode,
    morph,
    dimensions,
    setOpacity,
    startRenderLoop,
    render,
    stopRenderLoop,
  } = grid(gridNode, 'N@O$0A869#452I3=7+1/:-·` ')

  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  let intro = []

  const video = create('video', {
    autoplay: true,
    muted: true,
    loop: true,
  })
  const source = create('source')
  source.src = '/samsoe.mp4'
  source.type = 'video/mp4'
  video.appendChild(source)

  let opacity = 0

  animate({
    duration: 3000,
    easing: inQuad,
    onFrame: (n) => {
      opacity = n
    },
  })

  function handleFrame(now, metadata) {
    paintCanvas(video, {
      cover: true,
    })
    intro = createFromCanvas()
    setOpacity(intro, opacity)
    render(intro)
    video.requestVideoFrameCallback(handleFrame)
  }

  video.addEventListener('loadeddata', () => {
    video.play()
    // Only start frame-callback loop if the API is supported
    if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
      video.requestVideoFrameCallback(handleFrame)
    } else {
      console.warn(
        'requestVideoFrameCallback is not supported in this browser.'
      )
      // Fallback to another approach (see below).
    }
  })

  const aino = await loadimage('/aino.svg')
  const agency = await loadimage('/agency.svg')

  document.body.appendChild(canvas)

  gridNode.addEventListener(
    'click',
    async () => {
      video.pause()
      // await wait(200)
      const { update } = startRenderLoop()
      update(intro)
      const { y } = paintCanvas(aino, {
        scale: 0.44,
        alpha: 0.4,
      })
      const logo = createFromCanvas()
      for (const p of logo) {
        p.vx = Math.random()
        p.vy = Math.random()
      }
      morph(intro, logo)
      // await wait(2000)
      /*
      paintCanvas(agency, {
        scale: 0.78,
        alpha: 0.4,
        y,
      })
      const logo2 = createFromCanvas()
      gravitate(intro, {
        gravity: 3,
      })
      morph(intro, logo2)
      */
    },
    { once: true }
  )

  return () => {
    stopRenderLoop()
  }
}
