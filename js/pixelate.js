import { create, getCssVariable } from '@/js/utils/dom'

const steps = [0, 32, 64, 96, 128, 160, 192, 224, 255]

function create4x4x4Palette() {
  const palette = []
  for (let r of steps) {
    for (let g of steps) {
      for (let b of steps) {
        palette.push([r, g, b])
      }
    }
  }
  return palette
}

function approximateToStep(value) {
  const index = Math.min(8, Math.round(value / 32))
  return steps[index]
}

function getNearestColor(r, g, b) {
  return [approximateToStep(r), approximateToStep(g), approximateToStep(b)]
}

// Then in your dithering code:
const uniform64 = create4x4x4Palette()

function applyPalette(ctx, width, height) {
  if (width && height) {
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data // [r, g, b, a, r, g, b, a, ...]

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      // find nearest color in C64 palette
      const [nr, ng, nb] = getNearestColor(r, g, b, uniform64)
      data[i] = nr // replace R
      data[i + 1] = ng // replace G
      data[i + 2] = nb // replace B
      // alpha remains unchanged, or you could do data[i + 3] = 255
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

export default function pixelate(source, { factor = 1 } = {}) {
  let width = 0
  let height = 0
  let loaded = false

  const canvas = create('canvas', {
    class: 'pixelate',
  })
  const ctx = canvas.getContext('2d')

  source.parentNode.appendChild(canvas)

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
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
    applyPalette(ctx, canvas.width, canvas.height)
  }

  const onload = () => {
    loaded = true
    draw()
    if (source.tagName === 'VIDEO') {
      if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
        const onVideoFrame = () => {
          console.log('onframe')
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

  return () => {
    resizeObserver.disconnect()
    canvas.remove()
  }
}
