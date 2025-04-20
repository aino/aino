import multer from 'multer'
import path from 'path'
import fs from 'fs'

export function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        console.error('Middleware Error:', result) // Log the error
        return reject(result)
      }
      console.log('Middleware resolved successfully')
      return resolve(result)
    })
  })
}

// Multer setup
const assetsDir = path.join(process.cwd(), 'public/assets')

// Ensure the assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, assetsDir)
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  },
})

const upload = multer({ storage })

// Custom handler to work with Vercel
export const config = {
  api: {
    bodyParser: false, // Disable default body parser for multer
  },
}

export default async function handler(req, res) {
  req.on('data', () => {})
  if (req.method === 'POST') {
    try {
      // Run the multer middleware
      await runMiddleware(req, res, upload.single('file'))

      // Check if a file was uploaded
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: 'No file uploaded' })
      }

      // File uploaded successfully
      const filePath = `/assets/${req.file.filename}`
      return res.status(200).json({ success: true, filePath })
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message })
    }
  } else {
    // Handle other HTTP methods
    res.setHeader('Allow', ['POST'])
    return res
      .status(405)
      .json({ success: false, message: `Method ${req.method} Not Allowed` })
  }
}
