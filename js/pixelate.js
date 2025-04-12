import { create, getCssVariable } from '@/js/utils/dom'
import { getStyle, style } from './utils/dom'
import site, { themes } from './stores/site'
import { darkmode } from './utils/detect'

if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    this.beginPath()
    this.moveTo(x + r, y)
    this.lineTo(x + w - r, y)
    this.quadraticCurveTo(x + w, y, x + w, y + r)
    this.lineTo(x + w, y + h - r)
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    this.lineTo(x + r, y + h)
    this.quadraticCurveTo(x, y + h, x, y + h - r)
    this.lineTo(x, y + r)
    this.quadraticCurveTo(x, y, x + r, y)
    this.closePath()
  }
}

let palette = themes[site.value.theme]

const getColorFromVariable = (variable) => {
  const rgb = getStyle(document.documentElement, `--${variable}`)
  return rgb.split(',').map(Number)
}

const pushColor = (variable) => {
  palette.push(getColorFromVariable(variable))
}

pushColor('dark')
pushColor('light')

function getSaturation(r, g, b) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return max === 0 ? 0 : (max - min) / max // range: 0 (grey) to 1 (saturated)
}

function getNearestColor(inputColor, invert) {
  const [ir, ig, ib, ia] = inputColor
  const alpha = ia / 255
  const bg = getColorFromVariable(invert ? 'dark' : 'light')

  const blendedInput = [
    ir * alpha + bg[0] * (1 - alpha),
    ig * alpha + bg[1] * (1 - alpha),
    ib * alpha + bg[2] * (1 - alpha),
  ]

  let nearestColor = null
  let minDistance = Infinity

  for (const color of palette) {
    const [r, g, b] = color
    const distance =
      (r - blendedInput[0]) ** 2 +
      (g - blendedInput[1]) ** 2 +
      (b - blendedInput[2]) ** 2

    const saturation = getSaturation(r, g, b)
    const penalty = (1 - saturation) * 50
    const adjustedDistance = distance + penalty

    if (adjustedDistance < minDistance) {
      minDistance = adjustedDistance
      nearestColor = color
    }
  }

  return nearestColor
}

function applyPalette(ctx, width, height, invert = false) {
  if (width && height) {
    const imageData = ctx.getImageData(0, 0, width, height)
    const { data } = imageData

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i]
      let g = data[i + 1]
      let b = data[i + 2]
      const a = data[i + 3]

      if (invert) {
        r = 255 - r
        g = 255 - g
        b = 255 - b
      }

      const [nr, ng, nb] = getNearestColor([r, g, b, a], invert) // match to original palette

      data[i] = nr
      data[i + 1] = ng
      data[i + 2] = nb
      data[i + 3] = 255
    }

    ctx.putImageData(imageData, 0, 0)
  }
}

export const isVideoPlaying = (video) =>
  !!(
    video.currentTime > 0 &&
    !video.paused &&
    !video.ended &&
    video.readyState > 2
  )

export default function pixelate(
  source,
  { factor = 1, invertOnDarkMode = false } = {}
) {
  let width = 0
  let height = 0
  let loaded = false
  const destroyers = []

  const canvas = create('canvas', {
    class: 'pixelate',
  })
  const overlay = create('div', {
    class: 'overlay',
  })
  const pillCanvas = create('canvas')
  overlay.appendChild(pillCanvas)
  const ctx = canvas.getContext('2d')

  source.parentNode.appendChild(canvas)
  source.parentNode.appendChild(overlay)

  function drawGrid() {
    const ch = getCssVariable('ch')
    const line = getCssVariable('line')
    const rgb = getStyle(
      document.documentElement,
      site.value.appearance === 'dark' ? `--dark` : '--light'
    )

    pillCanvas.width = canvas.width * ch
    pillCanvas.height = canvas.height * line
    pillCanvas.style.width = `${canvas.width * ch}px`
    pillCanvas.style.height = `${canvas.height * line}px`

    const ctx = pillCanvas.getContext('2d')

    const dpr = window.devicePixelRatio || 1
    pillCanvas.width = pillCanvas.offsetWidth * dpr
    pillCanvas.height = pillCanvas.offsetHeight * dpr
    ctx.scale(dpr, dpr)

    const width = pillCanvas.offsetWidth
    const height = pillCanvas.offsetHeight

    ctx.clearRect(0, 0, width, height)

    const pillWidth = ch - 2
    const pillHeight = line - 2
    const pillRadius = Math.min(pillWidth, pillHeight) / 3

    // First: fill the whole canvas with background color
    ctx.fillStyle = `rgb(${rgb})`

    ctx.fillRect(0, 0, width, height)

    // Then: set composite mode to cut out
    ctx.globalCompositeOperation = 'destination-out'

    // Now draw pill shapes to erase them from the overlay
    for (let y = 0.5; y < height; y += line) {
      for (let x = 0.5; x < width; x += ch) {
        ctx.beginPath()
        ctx.roundRect(x, y, pillWidth, pillHeight, pillRadius)
        ctx.fill()
      }
    }

    // Reset composite mode back to normal (optional, for later drawing)
    ctx.globalCompositeOperation = 'source-over'
  }

  const draw = () => {
    if (!loaded) {
      return
    }
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
    const invert = invertOnDarkMode && site.value.appearance === 'dark'
    applyPalette(ctx, canvas.width, canvas.height, invert)
  }

  const resize = () => {
    const box = source.getBoundingClientRect()
    width = box.width
    height = box.height
    const ch = getCssVariable('ch')
    const line = getCssVariable('line')
    const newWidth = Math.round(width / ch) * factor
    const newHeight = Math.round(height / line) * factor
    canvas.width = newWidth
    canvas.height = newHeight
    canvas.style.width = `${newWidth * ch}px`
    canvas.style.height = `${newHeight * line}px`
    overlay.style.width = `${newWidth * ch}px`
    overlay.style.height = `${newHeight * line}px`
  }

  const onload = () => {
    loaded = true
    resize()
    draw()
    drawGrid()
    if (source.tagName === 'VIDEO') {
      if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
        const onVideoFrame = () => {
          draw()
          source.requestVideoFrameCallback(onVideoFrame)
        }
        if (isVideoPlaying(source)) {
          source.requestVideoFrameCallback(onVideoFrame)
        } else {
          source.addEventListener('play', () => {
            source.requestVideoFrameCallback(onVideoFrame)
          })
        }
      } else {
        let lastTime = 0

        function onVideoFrameFallback() {
          if (!source.paused && !source.ended) {
            const currentTime = source.currentTime

            // Check if enough time has advanced that we can treat it as a new frame
            // (you can fine-tune how sensitive you want this to be)
            if (Math.abs(currentTime - lastTime) >= 0.016) {
              lastTime = currentTime
              requestAnimationFrame(onVideoFrameFallback)
            }
          }
        }
        if (isVideoPlaying(source)) {
          requestAnimationFrame(onVideoFrameFallback)
        } else {
          source.addEventListener('play', () => {
            requestAnimationFrame(onVideoFrameFallback)
          })
        }
      }
    }
  }

  const resizeObserver = new ResizeObserver(() => {
    resize()
    draw()
    drawGrid()
  })

  resizeObserver.observe(source)

  switch (source.tagName) {
    case 'IMG':
      if (source.complete) {
        onload()
      } else {
        source.addEventListener('load', onload, { once: true })
      }
      break
    case 'VIDEO':
      if (source.readyState === 4 || isVideoPlaying(source)) {
        onload()
      } else {
        source.addEventListener('loadeddata', onload, { once: true })
      }
      break
    default:
      throw new Error(`Unsupported source: ${source.tagName}`)
  }

  destroyers.push(
    site.subscribe((newValue, oldValue) => {
      if (newValue.theme !== oldValue.theme) {
        palette = themes[newValue.theme]
        pushColor('dark')
        pushColor('light')
      }
      resize()
      draw()
      drawGrid()
    })
  )
  destroyers.push(() => {
    resizeObserver.disconnect()
    source.removeEventListener('load', onload)
    source.removeEventListener('loadeddata', onload)
    if (source.tagName === 'VIDEO') {
      source.removeEventListener('play', onload)
    }
    canvas.remove()
    overlay.remove()
  })

  return () => {
    destroyers.forEach((destroy) => destroy())
  }
}
