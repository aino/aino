import { compress } from '../js/utils/compress'
import vercel from '../vercel.json'
import { imageMetadataCache } from './preloadImageMetaData'

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
  const encodedUrl = encodeURIComponent(`${imagePath}`)
  const suffix = `${encodedUrl}&w=${size}&q=${quality} ${size}w`
  return isVercel ? `/_vercel/image?url=${suffix}` : `/_sharp/?path=${suffix}`
}

export default function handlebarsHelpers(Handlebars) {
  Handlebars.registerHelper('json', (context) => {
    return new Handlebars.SafeString(JSON.stringify(context, null, 2))
  })

  Handlebars.registerHelper('data', (context) => {
    if (!context || typeof window !== 'undefined') {
      return ''
    }
    return new Handlebars.SafeString(`data-render="${compress(context)}"`)
  })

  Handlebars.registerHelper('img', (imagePath) => {
    const sizes = vercel.images.sizes
    const quality = 85
    const { width, height } = imageMetadataCache[imagePath] || {}
    let src = `/images/${imagePath}`
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
