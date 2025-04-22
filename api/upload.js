import { config } from 'dotenv'
config()
import { put } from '@vercel/blob'

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { filename } = req.query
      const contentType =
        req.headers['content-type'] || 'application/octet-stream'
      const blob = await put(filename, req, {
        access: 'public',
        addRandomSuffix: true,
        contentType,
      })
      return res.status(200).json(blob)
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  } else {
    // Handle other HTTP methods
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }
}
