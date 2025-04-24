import { config as env } from 'dotenv'
env()
import { neon } from '@neondatabase/serverless'
import { getSession } from './session.js'

const sql = neon(process.env.DATABASE_URL)

export default async function handler(req, res) {
  if (!getSession(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  if (req.method === 'GET') {
    try {
      const { table, slug } = req.query
      let results
      if (!table || !slug) {
        return res.status(400).json({ error: 'Missing table or slug' })
      }
      if (table === 'work') {
        results = await sql`SELECT * FROM work WHERE slug = ${slug}`
      } else if (table === 'pages') {
        console.log('getting page', slug)
        results = await sql`SELECT * FROM pages WHERE slug = ${slug}`
      } else {
        return res.status(400).json({ error: 'Invalid table' })
      }
      const { data } = results[0]
      return res.status(200).json(data)
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  } else {
    // Handle other HTTP methods
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }
}
