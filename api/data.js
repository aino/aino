import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  const baseDir = path.join(process.cwd(), 'data') // Base directory for JSON files

  if (req.method === 'POST') {
    try {
      const { type, slug, data } = req.body
      console.log({ type, slug, data })
      if (!type || !slug || !data) {
        return res
          .status(400)
          .json({ success: false, message: 'Missing folder, slug, or data' })
      }

      const filePath = path.join(baseDir, type, `${slug}.json`)

      // Ensure the folder exists
      if (!fs.existsSync(path.dirname(filePath))) {
        return res
          .status(404)
          .json({ success: false, message: 'Folder not found' })
      }

      // Write the new data to the JSON file
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2))

      return res.status(200).json(data)
    } catch (error) {
      console.error(error)
      return res
        .status(500)
        .json({ success: false, message: 'Failed to update file' })
    }
  } else if (req.method === 'GET') {
    try {
      const { type, slug } = req.query

      if (!type || !slug) {
        return res.status(400).json({ code: 'missing-folder' })
      }

      const filePath = path.join(baseDir, type, `${slug}.json`)

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ code: 'not-found' })
      }

      const fileData = fs.readFileSync(filePath, 'utf-8')
      const jsonData = JSON.parse(fileData)

      return res.status(200).json(jsonData)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ code: 'fetch-fail' })
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET'])
    return res.status(405).json({ code: `not-allowed` })
  }
}
