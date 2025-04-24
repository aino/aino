import { compress } from '../js/utils/compress'
import vercel from '../vercel.json'

// Thos code will run in the browser and on the server

let isVercel = false
if (typeof location !== 'undefined') {
  // eslint-disable-next-line
  isVercel = !/localhost/.test(location.hostname)
} else {
  isVercel =
    process.env.VERCEL === '1' &&
    (process.env.VERCEL_ENV === 'preview' ||
      process.env.VERCEL_ENV === 'production')
}

const getImageSrc = ({ url, size, quality }) => {
  const encodedUrl = encodeURIComponent(url)
  const suffix = `${encodedUrl}&w=${size}&q=${quality} ${size}w`
  return isVercel ? `/_vercel/image?url=${suffix}` : `/_sharp/?path=${suffix}`
}

export default function handlebarsHelpers(Handlebars) {
  Handlebars.registerHelper('json', (context) => {
    return new Handlebars.SafeString(JSON.stringify(context, null, 2))
  })

  Handlebars.registerHelper('zeropad', function (index) {
    // If you want the first item to be "001", you can do (index + 1):
    return String(index + 1).padStart(3, '0')
  })

  Handlebars.registerHelper('colclass', (context) => {
    return `col-${context?.length}`
  })

  Handlebars.registerHelper('data', (context) => {
    if (!context || typeof window !== 'undefined') {
      return ''
    }
    return new Handlebars.SafeString(`data-render="${compress(context)}"`)
  })

  Handlebars.registerHelper('column', function (context) {
    const classNames = ['col']
    const { className = '', top, left, width } = context.hash
    const content = context.fn(this)
    let styles = []
    if (top) {
      styles.push(`top: calc(var(--line) * ${top});`)
    }
    if (left) {
      styles.push(`left: calc(var(--char2) * ${left});`)
    }
    const styleAttr = styles.length ? ` style="${styles.join(' ')}"` : ''
    if (className) {
      classNames.push(className)
    }
    if (width) {
      classNames.push(`w${width}`)
    }
    return `<div class="${classNames.join(
      ' '
    )}"${styleAttr}>${content.trim()}</div>`
  })

  Handlebars.registerHelper('worktitle', function (context) {
    const { name, position, reel, year } = context.hash
    const video = reel
      ? `<a href="${reel}" target="_blank" class="reel" data-preventclick="true" title="${name} reel"><span>▶︎</span> Play reel</a>`
      : ''
    return new Handlebars.SafeString(
      `<div style="top: calc(${8 + position}*var(--line))" class="worktitle">
        <span class="position">${String(position + 1).padStart(3, '0')}</span>
        <span class="title"><h1>${name}</h1></span>
        <span class="look">${video}</span>
        <span class="year">${year}</span>
      </div>`
    )
  })

  Handlebars.registerHelper('img', (context) => {
    let { colWidth = 2, url, width, height, sizes } = context.hash
    if (!url) {
      console.log('No URL provided for image helper', context)
    }
    if (colWidth && !sizes) {
      const fraction = colWidth / 8
      sizes = `(max-width: 768px) 50vw, ${fraction * 90}vw`
    }
    const imageSizes = vercel.images.sizes
    if (url.startsWith('data:')) {
      return new Handlebars.SafeString(`src="${url}"`)
    }
    if (url === 'placeholder') {
      return new Handlebars.SafeString(
        'class="placeholder" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="'
      )
    }
    const quality = 85
    let src = url
    let props = ''
    if (width) {
      const size = imageSizes.reduce((prev, curr) =>
        Math.abs(curr - width) < Math.abs(prev - width) ? curr : prev
      )
      src = getImageSrc({ url, size, quality })
      props = ` width="${width}"`
      if (height) {
        props = `${props} height="${height}"`
      }
    }
    if (sizes) {
      props = `${props} sizes="${sizes}"`
    }

    const srcSet = imageSizes
      .map((size) => getImageSrc({ url, size, quality }))
      .join(', ')
    return new Handlebars.SafeString(`src="${src}" srcSet="${srcSet}"${props}`)
  })
}
