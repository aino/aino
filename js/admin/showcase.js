import { q } from '../utils/dom'

export const path = /^\/work\/[^/]+$/

export default function showcase() {
  const [dropzone] = q('.dropzone')
  const [progressBarContainer] = q('.progress-bar-container')
  const [progressBar] = q('.progress-bar')

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault()
    dropzone.classList.add('hover')
  })

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('hover')
  })

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault()
    dropzone.classList.remove('hover')
    const files = e.dataTransfer.files

    if (files.length > 0) {
      const formData = new FormData()
      formData.append('file', files[0])

      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/upload', true)

      // Show progress bar container
      progressBarContainer.style.display = 'block'

      // Update progress bar during upload
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100
          progressBar.style.width = `${percentComplete}%`
        }
      })

      // Handle upload success
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText)
          if (response.success) {
            alert('Image uploaded successfully!')
          } else {
            alert('Upload failed!')
          }
        } else {
          alert('Upload failed!')
        }

        // Reset progress bar
        progressBarContainer.style.display = 'none'
        progressBar.style.width = '0%'
      })

      // Handle upload errors
      xhr.addEventListener('error', () => {
        alert('An error occurred during the upload.')
        progressBarContainer.style.display = 'none'
        progressBar.style.width = '0%'
      })

      // Send the request
      xhr.send(formData)
    }
  })

  console.log('Im on a slug page')
}
