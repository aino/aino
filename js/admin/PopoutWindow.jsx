import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const PopoutWindow = ({ children, onClose }) => {
  const externalWindow = useRef(null)
  const containerRef = useRef(null)
  const observerRef = useRef(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const alreadyOpen =
      window.adminPopoutWindow && !window.adminPopoutWindow.closed
    if (alreadyOpen) {
      externalWindow.current = window.adminPopoutWindow
    } else {
      externalWindow.current = window.open(
        '',
        '',
        `width=300,height=${screen.height},top=0,left=${
          screen.width - 300
        },toolbar=no,menubar=no,scrollbars=no,resizable=yes,status=no`
      )

      if (!externalWindow.current) {
        console.error('Popup blocked. Unable to open Admin popout window.')
        onClose?.()
        localStorage.setItem('admin-popped-out', 'false')
        return
      }

      window.adminPopoutWindow = externalWindow.current

      const doc = externalWindow.current.document
      doc.title = 'Admin Panel'

      // --- Copy initial styles ---
      Array.from(
        document.head.querySelectorAll('style, link[rel="stylesheet"]')
      ).forEach((node) => {
        doc.head.appendChild(node.cloneNode(true))
      })

      // --- Inject your custom styles ---
      const customStyles = document.createElement('style')
      customStyles.textContent = `
        :root {
          --ch: 7.5;
          --font-size: 12px;
          --line-height: 15px;
          --letter-spacing: 0.5px;
        }
        #admin .container {
          position: static!important;
          width: 100%!important;
          height: 100%!important;
        }
        html.disabled .container {
          display: none!important;
        }
      `
      doc.head.appendChild(customStyles)

      // --- Setup MutationObserver to copy dynamically loaded styles (e.g., ACE editor) ---
      observerRef.current = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (
              node.tagName === 'STYLE' ||
              (node.tagName === 'LINK' && node.rel === 'stylesheet')
            ) {
              doc.head.appendChild(node.cloneNode(true))
            }
          })
        })
      })

      observerRef.current.observe(document.head, { childList: true })
    }

    const doc = externalWindow.current.document
    if (doc.body) {
      doc.body.innerHTML = '' // Clear old content if reused
      const container = doc.createElement('div')
      container.id = 'admin'
      doc.body.appendChild(container)
      containerRef.current = container
    }

    setMounted(true)

    const cleanup = () => {
      onClose?.()
      localStorage.setItem('admin-popped-out', 'false')
      window.adminPopoutWindow = null
      observerRef.current?.disconnect()
    }

    externalWindow.current.addEventListener('beforeunload', cleanup)

    return () => {
      externalWindow.current?.removeEventListener('beforeunload', cleanup)
      observerRef.current?.disconnect()
      try {
        if (containerRef.current && containerRef.current.parentNode) {
          containerRef.current.parentNode.removeChild(containerRef.current)
        }
      } catch (err) {
        console.warn('Error cleaning up popout window:', err)
      }
    }
  }, [])

  if (!mounted || !containerRef.current) return null

  return createPortal(children, containerRef.current)
}

export default PopoutWindow
