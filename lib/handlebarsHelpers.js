import { locales } from '../data.config'
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

const getImageSrc = ({ imagePath, size, quality }) => {
  const encodedUrl = encodeURIComponent(imagePath)
  const suffix = `${encodedUrl}&w=${size}&q=${quality} ${size}w`
  return isVercel ? `/_vercel/image?url=${suffix}` : `/_sharp/?path=${suffix}`
}

export default function handlebarsHelpers(Handlebars, imageMetadataCache = {}) {
  Handlebars.registerHelper('json', (context) => {
    return new Handlebars.SafeString(JSON.stringify(context, null, 2))
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

  Handlebars.registerHelper('column', function (span, options) {
    console.log(options)
    const content = options.fn(this)
    return `<div class="span-${span || 1}">${content}</div>`
  })

  Handlebars.registerHelper('img', (imagePath, options) => {
    const sizes = vercel.images.sizes
    if (!imagePath) {
      console.error('No image path provided', options)
      return ''
    }
    if (imagePath.startsWith('data:')) {
      return new Handlebars.SafeString(`src="${imagePath}"`)
    }
    if (imagePath === 'placeholder') {
      return new Handlebars.SafeString(
        'class="placeholder" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="'
      )
    }
    const quality = 85

    let { width, height } = imageMetadataCache[imagePath] || options?.hash || {}
    let src = imagePath
    let wh = ''
    if (width) {
      const size = sizes.reduce((prev, curr) =>
        Math.abs(curr - width) < Math.abs(prev - width) ? curr : prev
      )
      src = getImageSrc({ imagePath, size, quality })
      wh = ` width="${width}"`
      if (height) {
        wh = `${wh} height="${height}"`
      }
    }

    const srcSet = sizes
      .map((size) => getImageSrc({ imagePath, size, quality }))
      .join(', ')
    return new Handlebars.SafeString(`src="${src}" srcSet="${srcSet}"${wh}`)
  })
}
