import { config as env } from 'dotenv'
env()
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

// Custom handler to work with Vercel
export const config = {
  api: {
    bodyParser: false, // Disable default body parser for multer
  },
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { data, slug, table } = req.body
      await sql`INSERT INTO work (slug, data) VALUES (${slug}, ${data}) ON CONFLICT (slug) DO UPDATE SET data = ${data}`
      return res.status(200).json({ success: true })
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
