import { create, getCssVariable } from '@/js/utils/dom'

export default function pixelate(source) {
  let width = 0
  let height = 0
  let loaded = false

  const canvas = create('canvas', {
    class: 'pixelate',
  })
  const ctx = canvas.getContext('2d')

  source.parentNode.appendChild(canvas)

  const draw = (factor = 1) => {
    if (!loaded) {
      return
    }
    const box = source.getBoundingClientRect()
    width = box.width
    height = box.height
    const rem = getCssVariable('ch')
    canvas.width = Math.round(width / rem) * factor
    canvas.height = Math.round(height / (2 * rem)) * factor
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  }

  const onload = () => {
    loaded = true
    draw()
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
    default:
      throw new Error(`Unsupported source: ${source.tagName}`)
  }

  return draw
}
