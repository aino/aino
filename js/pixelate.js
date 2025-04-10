import { create, getCssVariable } from '@/js/utils/dom'
import { getStyle, style } from './utils/dom'
import site, { themes } from './stores/site'

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
    const distance = Math.sqrt(
      Math.pow(r - blendedInput[0], 2) +
        Math.pow(g - blendedInput[1], 2) +
        Math.pow(b - blendedInput[2], 2)
    )

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
  const ctx = canvas.getContext('2d')

  source.parentNode.appendChild(canvas)
  source.parentNode.appendChild(overlay)

  const draw = () => {
    if (!loaded) {
      return
    }
    const box = source.getBoundingClientRect()
    width = box.width
    height = box.height
    const rem = getCssVariable('ch')
    const line = getCssVariable('line')
    canvas.width = Math.round(width / rem) * factor
    canvas.height = Math.round(height / line) * factor
    canvas.style.width = `${canvas.width * rem}px`
    canvas.style.height = `${canvas.height * line}px`
    overlay.style.width = `${canvas.width * rem}px`
    overlay.style.height = `${canvas.height * line}px`
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
    const invert = invertOnDarkMode && site.value.appearance === 'dark'
    applyPalette(ctx, canvas.width, canvas.height, invert)
  }

  const onload = () => {
    loaded = true
    draw()
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

  const resizeObserver = new ResizeObserver(() => draw())
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
    site.subscribe((newValue) => {
      palette = themes[newValue.theme]
      pushColor('dark')
      pushColor('light')
      draw()
    })
  )

  return () => {
    resizeObserver.disconnect()
    canvas.remove()
    overlay.remove()
    destroyers.forEach((destroy) => destroy())
  }
}
