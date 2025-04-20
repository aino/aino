import fs from 'fs'
import path from 'path'

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
      const data = req.body
      console.log(data)
      const filePath = path.join(
        process.cwd(),
        'data',
        'work',
        `${data.slug}.json`
      )
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
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
