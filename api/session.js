import { config } from 'dotenv'
config()

import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.SECRET

function parseCookies(req) {
  const cookie = req.headers?.cookie
  if (!cookie) return {}
  return Object.fromEntries(
    cookie.split(';').map((part) => {
      const [key, ...v] = part.trim().split('=')
      return [key, decodeURIComponent(v.join('='))]
    })
  )
}

export default function handler(req, res) {
  const cookies = parseCookies(req)
  const token = cookies.token

  if (!token) {
    return res.status(200).json(null)
  }

  try {
    const session = jwt.verify(token, JWT_SECRET)
    res.status(200).json(session)
  } catch {
    res.status(200).json(null)
  }
}
