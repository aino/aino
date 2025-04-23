import { handleUpload } from '@vercel/blob/client'
import { getSession } from './session.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }
  if (!getSession(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const body = req.body

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/avif',
            'image/webp',
            'video/mp4',
          ],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({}),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('blob upload completed', blob, tokenPayload)
      },
    })

    res.status(200).json(jsonResponse)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
