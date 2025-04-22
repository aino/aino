import { config } from 'dotenv'
config()
import { serialize } from 'cookie'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const PASSWORD = process.env.PASSWORD // store in Vercel env vars
const JWT_SECRET = process.env.SECRET

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { password } = req.body

  if (password.toLowerCase() !== PASSWORD.toLowerCase()) {
    return res.status(401).json({ error: 'Invalid password' })
  }

  const session = {
    id: crypto.randomUUID(),
    created: Date.now(),
  }

  const token = jwt.sign(session, JWT_SECRET, { expiresIn: '7d' })

  res.setHeader(
    'Set-Cookie',
    serialize('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
  )

  const decodedSession = jwt.decode(token)

  res.status(200).json({ success: true, session: decodedSession })
}
