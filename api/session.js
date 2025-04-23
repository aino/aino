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

export const getSession = (req) => {
  const cookies = parseCookies(req)
  const token = cookies.token
  if (!token) return null
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (err) {
    return null
  }
}

export default function handler(req, res) {
  res.status(200).json(getSession(req))
}
