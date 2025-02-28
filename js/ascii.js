import { create, getCssVariable } from '@/js/utils/dom'

export const toGrayScale = ({ r, g, b }) => 0.21 * r + 0.72 * g + 0.07 * b

export const grayRamp = 'N@O$0A869#452I3=7+1/:-·` '

export const getCharacterForGrayScale = (grayScale) =>
  grayRamp[Math.ceil(((grayRamp.length - 1) * grayScale) / 255)]

export default function ascii(source) {
  let width = 0
  let height = 0
  let loaded = false

  const canvas = create('canvas')
  const ctx = canvas.getContext('2d')

  const text = create('div', {
    class: 'ascii',
  })

  source.parentNode.appendChild(text)

  const draw = () => {
    if (!loaded) {
      return
    }
    const box = source.getBoundingClientRect()
    width = box.width
    height = box.height
    const rem = getCssVariable('rem')
    canvas.width = Math.round(width / rem)
    canvas.height = Math.round(height / (2 * rem))
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let chars = ''
    for (let i = 0; i < imageData.data.length; i += 4) {
      const [r, g, b] = imageData.data.slice(i, i + 3)
      const l = toGrayScale({ r, g, b })
      const lastChar = (i / 4 + 1) % canvas.width === 0
      chars += `${getCharacterForGrayScale(l)}${lastChar ? '\n' : ''}`
    }
    text.innerHTML = chars
  }

  const resizeObserver = new ResizeObserver(() => draw())
  resizeObserver.observe(source)

  const onload = () => {
    loaded = true
    draw()
  }

  switch (source.tagName) {
    case 'IMG':
      console.log('source', source, source.complete)
      if (source.complete) {
        onload()
      } else {
        source.addEventListener('load', onload, { once: true })
      }
      break
    case 'VIDEO':
      console.log('TODO VIDEO')
      break
    case 'CANVAS':
      draw()
      break
    default:
      throw new Error(`Unsupported source: ${source.tagName}`)
  }

  return draw
}
