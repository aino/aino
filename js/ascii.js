import { create, getCssVariable } from '@/js/utils/dom'
import { getStyle, style } from './utils/dom'
import { isVideoPlaying } from './pixelate'

export const toGrayScale = ({ r, g, b }) => 0.21 * r + 0.72 * g + 0.07 * b

export const grayRamp = 'NO0A869452I3?!<>=+/:-·'

export const getCharacterForGrayScale = (grayScale) =>
  grayRamp[Math.ceil(((grayRamp.length - 1) * grayScale) / 255)]

export default function ascii(source, filter = (chars) => chars) {
  let width = 0
  let height = 0
  let loaded = false

  const canvas = create('canvas')
  const ctx = canvas.getContext('2d')

  const text = create('div', {
    class: 'ascii',
  })

  source.parentNode.appendChild(text)

  let naturalWidth = 0
  let naturalHeight = 0
  let tempImage

  const objectFit = getStyle(source, 'object-fit')

  const draw = () => {
    if (!loaded || !source) {
      return
    }
    const box = source.getBoundingClientRect()
    width = box.width
    height = box.height
    const ch = getCssVariable('ch')
    const line = getCssVariable('line')
    canvas.width = Math.round(width / ch)
    canvas.height = Math.round(height / line)

    if (objectFit === 'cover') {
      const objectPosition = getStyle(source, 'object-position')
      const [posX, posY] = objectPosition.split(' ')
      const s = Math.max(
        canvas.width / naturalWidth,
        (canvas.height / naturalHeight) * 2
      )
      const nw = naturalWidth * s
      const nh = (naturalHeight * s) / 2
      let offsetX = 0
      let offsetY = 0
      offsetX = (canvas.width - nw) * (parseFloat(posX) / 100)
      offsetY = (canvas.height - nh) * (parseFloat(posY) / 100)
      ctx.drawImage(
        tempImage,
        0,
        0,
        naturalWidth,
        naturalHeight,
        offsetX,
        offsetY,
        nw,
        nh
      )
    } else {
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
    }
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let chars = ''
    for (let i = 0; i < imageData.data.length; i += 4) {
      const [r, g, b] = imageData.data.slice(i, i + 3)
      const l = toGrayScale({ r, g, b })
      const lastChar = (i / 4 + 1) % canvas.width === 0
      chars += `${getCharacterForGrayScale(l)}${lastChar ? '\n' : ''}`
    }
    text.innerText = filter(chars)
  }

  const resizeObserver = new ResizeObserver(() => draw())
  resizeObserver.observe(source)

  const onload = () => {
    if (objectFit === 'cover') {
      tempImage = new Image()
      const sets = source.srcset.split(', ')
      const url = sets[1].split(' ')[0]
      tempImage.onload = () => {
        naturalWidth = tempImage.width
        naturalHeight = tempImage.height
        loaded = true
        draw()
      }
      tempImage.src = url
    } else {
      naturalWidth = source.width
      naturalHeight = source.height
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
  }

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
    case 'CANVAS':
      draw()
      break
    default:
      throw new Error(`Unsupported source: ${source.tagName}`)
  }

  return () => {
    text.remove()
    resizeObserver.disconnect()
    if (source.tagName === 'VIDEO') {
      source.removeEventListener('loadeddata', onload)
    }
  }
}
