import { config as env } from 'dotenv'
env()
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { table, slug } = req.query
      const results = await sql`SELECT * FROM work WHERE slug = ${slug}`
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
