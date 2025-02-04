import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs/promises' // Use promises version for async operations

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = 3001

// Middleware to parse JSON request bodies
app.use(express.json())

// Dynamically load route files from the "api" folder
const apiDir = join(__dirname, 'api')

;(async () => {
  try {
    const files = await fs.readdir(apiDir)

    await Promise.all(
      files.map(async (file) => {
        const route = `/${file.replace('.js', '')}`
        const { default: handler } = await import(join(apiDir, file))
        app.all(route, (req, res) => handler(req, res))
      })
    )

    app.listen(PORT, () => {
      console.log(`API server running at http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Failed to load API routes:', error)
  }
})()
