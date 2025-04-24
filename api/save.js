import { config as env } from 'dotenv'
env()
import { neon } from '@neondatabase/serverless'
import { getSession } from './session.js'

const sql = neon(process.env.DATABASE_URL)

// Custom handler to work with Vercel
export const config = {
  api: {
    bodyParser: false, // Disable default body parser for multer
  },
}

export default async function handler(req, res) {
  if (!getSession(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  if (req.method === 'POST') {
    try {
      const { data, slug, table } = req.body
      if (!data || !slug || !table) {
        return res.status(400).json({ error: 'Missing data, slug or table' })
      }
      if (table === 'work') {
        await sql`INSERT INTO work (slug, data) VALUES (${slug}, ${data}) ON CONFLICT (slug) DO UPDATE SET data = ${data}`
      } else if (table === 'pages') {
        await sql`INSERT INTO pages (slug, data) VALUES (${slug}, ${data}) ON CONFLICT (slug) DO UPDATE SET data = ${data}`
      } else {
        return res.status(400).json({ error: 'Invalid table' })
      }
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
