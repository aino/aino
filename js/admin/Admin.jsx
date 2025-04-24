import React, { useRef, useState, useEffect, useMemo } from 'react'
import Section from './Section.jsx'
import { upload } from '@vercel/blob/client'
import Input from './Input'
import { clone } from '../utils/object.js'

const Admin = ({ data, setData, sections, slug, revert, table }) => {
  const html = document.documentElement
  const [position, setPosition] = useState({
    x: localStorage.getItem('admin-x') || 100,
    y: localStorage.getItem('admin-y') || 100,
  }) // initial position
  const [saving, setSaving] = useState(false)
  const [draggingAdmin, setDraggingAdmin] = useState(false)
  const [dragIndex, setDragIndex] = useState(null)
  const offset = useRef({ x: 0, y: 0 })
  const adminRef = useRef(null)
  const mouseDownTargetRef = useRef(null)
  const [open, setOpen] = useState([])
  const [controls, setControls] = useState(true)
  const [grid, setGrid] = useState(localStorage.getItem('grid') === 'true')
  const toggleOpen = (index, force) => {
    const nextOpen = [...open]
    const i = open.indexOf(index)
    const shouldBeOpen = force === undefined ? i === -1 : force

    if (shouldBeOpen && i === -1) nextOpen.push(index)
    if (!shouldBeOpen && i > -1) nextOpen.splice(i, 1)
    setOpen(nextOpen)
  }

  useEffect(() => {
    html.classList.toggle('grid', grid)
    localStorage.setItem('grid', grid)
  }, [grid])

  useEffect(() => {
    const onClick = (e) => {
      const target = e.target.closest('section')
      if (!target) return
      const index = [...target.parentNode.children].indexOf(target)
      setControls(true)
      toggleOpen(index)
    }
    const onMouseOver = (e) => {
      const target = e.target.closest('section')
      if (!target) return
      target.classList.add('outline')
    }
    const onMouseOut = (e) => {
      const target = e.target.closest('section')
      if (!target) return
      target.classList.remove('outline')
    }

    sections.addEventListener('click', onClick)
    sections.addEventListener('mouseover', onMouseOver)
    sections.addEventListener('mouseout', onMouseOut)
    return () => {
      sections.removeEventListener('click', onClick)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('admin-x', position.x)
    localStorage.setItem('admin-y', position.y)
  }, [position])

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!draggingAdmin) return

      const newX = e.clientX - offset.current.x
      const newY = e.clientY - offset.current.y
      const adminEl = adminRef.current
      const { offsetWidth, offsetHeight } = adminEl
      const maxX = window.innerWidth - offsetWidth
      const maxY = window.innerHeight - offsetHeight
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      })
    }

    const handleMouseUp = () => {
      setDraggingAdmin(false)
      setDragIndex(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draggingAdmin])

  const startDrag = (e) => {
    const rect = adminRef.current.getBoundingClientRect()
    offset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
    setDraggingAdmin(true)
  }

  // Section sorting
  const handleSectionDragStart = (index, e) => {
    const target = mouseDownTargetRef.current
    if (
      target &&
      target.closest('input, textarea, select, [contenteditable]')
    ) {
      e.preventDefault()
      return
    }

    e.stopPropagation()
    setDragIndex(index)
  }

  const handleSectionDragEnter = (hoverIndex) => {
    if (dragIndex === null || dragIndex === hoverIndex) return
    const updated = [...data.sections]
    const [removed] = updated.splice(dragIndex, 1)
    updated.splice(hoverIndex, 0, removed)
    setDragIndex(hoverIndex)
    setData({ ...data, sections: updated })
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const uploads = []
      for (const section of data.sections) {
        for (const column of section.columns || []) {
          if (column.image?.file) {
            uploads.push({
              file: column.image.file,
              destination: column.image,
            })
          }
          if (column.video?.file) {
            uploads.push({
              file: column.video.file,
              destination: column.video,
            })
          }
        }
      }
      for (const { file, destination } of uploads) {
        const blob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/upload',
        })
        destination.url = blob.url
        delete destination.file
      }
      await fetch('/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data, slug, table }),
      })
    } catch (error) {
      alert('Error saving data: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const deploy = async (e) => {
    if (confirm('Deploy? (takes about 1 minute)')) {
      await fetch(
        'https://api.vercel.com/v1/integrations/deploy/prj_EOe92vX7WcH6G4sK0y7WZfzTC75K/XuHEn5Vb6S',
        {
          method: 'POST',
        }
      )
    }
  }

  const fieldInputs = useMemo(() => {
    const d = clone(data)
    delete d.sections
    const order = ['title', 'subtitle', 'location', 'active']
    return Object.keys(d).sort((a, b) => {
      const aIndex = order.indexOf(a)
      const bIndex = order.indexOf(b)
      if (aIndex === -1 && bIndex === -1) return 0
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    })
  }, [data])

  return (
    <div
      className={['container', controls ? 'show' : ''].join(' ')}
      ref={adminRef}
      style={{
        position: 'fixed',
        top: `${position.y}px`,
        left: `${position.x}px`,
      }}
    >
      <h2 className="maintitle" onMouseDown={startDrag}>
        <span>{saving ? 'Saving...' : 'Admin'}</span>
        <div>
          <button
            className="ghost grid-btn"
            title="Show grid"
            onClick={() => setGrid(!grid)}
          >
            G
          </button>
          <button
            className="ghost revert"
            title="Revert"
            onClick={() => {
              confirm('Revert?') && revert()
            }}
          >
            R
          </button>
          <button className="ghost save" title="Save" onClick={save}>
            S
          </button>
          <button className="ghost deploy" title="Deploy" onClick={deploy}>
            D
          </button>
          <button
            className="ghost open"
            title="Toggle"
            onClick={() => setControls(!controls)}
          >
            {controls ? '–' : '+'}
          </button>
        </div>
      </h2>
      <div className="controls">
        {fieldInputs.length ? (
          <div className="inputs">
            {fieldInputs.map((field) => {
              if (typeof data[field] === 'boolean') {
                return (
                  <label key={field} className="checkbox">
                    <input
                      type="checkbox"
                      checked={data[field]}
                      onChange={(e) => {
                        setData({
                          ...data,
                          [field]: e.target.checked,
                        })
                      }}
                    />
                    <span>{field}</span>
                  </label>
                )
              }
              return (
                <label key={field}>
                  <Input
                    value={data[field]}
                    onChange={(e) => {
                      setData({
                        ...data,
                        [field]: e.target.value,
                      })
                    }}
                    className={field}
                    type="text"
                    placeholder={field}
                  />
                </label>
              )
            })}
          </div>
        ) : null}
        {data.sections.map((section, i) => {
          return (
            <div
              key={i}
              draggable
              onMouseDown={(e) => {
                mouseDownTargetRef.current = e.target
              }}
              onDragStart={(e) => handleSectionDragStart(i, e)}
              onDragEnter={() => handleSectionDragEnter(i)}
              onDragOver={(e) => e.preventDefault()}
              onDragEnd={() => setDragIndex(null)}
              style={{
                opacity: dragIndex === i ? 0.3 : 1,
                cursor: 'move',
              }}
              className="sectioncontainer"
            >
              <Section
                toggleOpen={() => toggleOpen(i)}
                open={open.includes(i)}
                section={section}
                onChange={(newSection) => {
                  const newData = data.sections.map((s) => {
                    if (s === section) {
                      return newSection
                    }
                    return s
                  })
                  setData({
                    ...data,
                    sections: newData,
                  })
                }}
              />
            </div>
          )
        })}
        <button
          className="addsection"
          onClick={() => {
            setData({
              ...data,
              sections: [
                ...data.sections,
                {
                  className: '',
                },
              ],
            })
            requestAnimationFrame(() => {
              toggleOpen(data.sections.length, true)
            })
          }}
        >
          <span>+</span>
          <span>Add Section</span>
        </button>
      </div>
    </div>
  )
}

export default Admin
