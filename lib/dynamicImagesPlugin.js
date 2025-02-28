import fs from 'fs'
import { join } from 'path'
import sharp from 'sharp'
import fetch from 'node-fetch'

const middleware = async (req, res, next) => {
  const url = req.url

  // Match the dynamic image resizing route
  if (url.startsWith('/_sharp/')) {
    try {
      const query = new URLSearchParams(url.split('?')[1])
      const imagePath = query.get('path')
      const width = parseInt(query.get('w'), 10)
      const quality = parseInt(query.get('q'), 10) || 80

      if (!imagePath || !width) {
        res.statusCode = 400
        res.end('Invalid parameters')
        return
      }

      let img

      if (imagePath.startsWith('/')) {
        const imageFullPath = join(__dirname, '..', 'public', imagePath)
        if (!fs.existsSync(imageFullPath)) {
          res.statusCode = 404
          res.end('Image not found')
          return
        }
        img = sharp(imageFullPath)
      } else if (
        imagePath.startsWith('http://') ||
        imagePath.startsWith('https://')
      ) {
        // External URL
        const response = await fetch(imagePath)
        if (!response.ok) {
          res.statusCode = 404
          res.end('Image not found')
          return
        }
        const buffer = await response.buffer()
        img = sharp(buffer)
      } else {
        res.statusCode = 400
        res.end('Invalid image path')
        return
      }

      const buffer = await img.resize(width).jpeg({ quality }).toBuffer()

      res.setHeader('Content-Type', 'image/jpeg')
      res.end(buffer)
    } catch (err) {
      console.error(err)
      res.statusCode = 500
      res.end('Image processing error')
    }
  } else {
    next()
  }
}

export default function dynamicImageResizePlugin() {
  return {
    name: 'dynamic-image-resize',
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        await middleware(req, res, next)
      })
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        await middleware(req, res, next)
      })
    },
  }
}
