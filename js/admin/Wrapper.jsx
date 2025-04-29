import React, { useState, useEffect } from 'react'
import Admin from './Admin.jsx'
import PopoutWindow from './PopoutWindow'

const AdminWrapper = (props) => {
  const [poppedOut, setPoppedOut] = useState(
    () => localStorage.getItem('admin-popped-out') === 'true'
  )

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (window.adminPopoutWindow && !window.adminPopoutWindow.closed) {
        window.adminPopoutWindow.close()
        window.adminPopoutWindow = null
      }
      localStorage.removeItem('admin-popped-out') // Optional: reset state
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('admin-popped-out', poppedOut ? 'true' : 'false')
  }, [poppedOut])

  return (
    <>
      {!poppedOut ? (
        <Admin {...props} setPoppedOut={setPoppedOut} />
      ) : (
        <PopoutWindow onClose={() => setPoppedOut(false)}>
          <Admin {...props} isPopup setPoppedOut={setPoppedOut} />
        </PopoutWindow>
      )}
    </>
  )
}

export default AdminWrapper
