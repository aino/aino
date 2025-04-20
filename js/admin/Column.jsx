import React, { useState, useMemo, useRef } from 'react'
import { stripHtml } from '../utils/string'

export default function Column({ column, onChange }) {
  const [open, setData] = useState(false)
  const file = useRef(null)
  const [edit, setEdit] = useState(false)
  const onFileUpload = (e) => {
    const input = e.target
    const file = input.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = function (e) {
      const dataURL = e.target.result

      if (file.type.startsWith('video/')) {
        // Video upload
        onChange({
          ...column,
          video: {
            url: dataURL,
          },
        })
      } else if (file.type.startsWith('image/')) {
        // Image upload
        const img = new Image()
        img.onload = function () {
          const { width, height, src: url } = img
          onChange({
            ...column,
            image: {
              url,
              width,
              height,
            },
          })
        }
        img.src = dataURL
      } else {
        alert('Unsupported file type')
      }
    }

    reader.readAsDataURL(file)
  }

  const fileName = useMemo(() => {
    const name = column.image || column.video
    if (!name) return 'Click to upload'
    return name.url.slice(0, 17).toLowerCase() + '...'
  }, [column.image, column.video])

  const text = useMemo(() => {
    if (column.html) {
      return stripHtml(column.html).slice(0, 17) + '...'
    }
    return 'Click to add html'
  })

  if (edit) {
    return (
      <div className="texteditor">
        <textarea
          autoFocus
          onChange={(e) => {
            const value = e.target.value
            onChange({
              ...column,
              html: value,
            })
          }}
          defaultValue={column.html}
        ></textarea>
        <button onClick={() => setEdit(false)}>
          <span>Done</span>
        </button>
      </div>
    )
  }

  return (
    <div className={['column', open ? 'open' : ''].join(' ')}>
      <div className="title">
        <button className="ghost" onClick={() => setData(!open)}>
          <span>›</span>
          <span>Column</span>
        </button>
        <button
          title="Delete column"
          className="delete small ghost"
          onClick={(e) => {
            if (window.confirm('Delete column?')) {
              e.stopPropagation()
              onChange(null)
            }
          }}
        >
          ×
        </button>
      </div>
      <div className="content">
        <label className="file">
          <div>{fileName}</div>
          <input type="file" ref={file} value="" onChange={onFileUpload} />
          {column.image || column.video ? (
            <button
              className="ghost delete small"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onChange({
                  ...column,
                  image: null,
                  video: null,
                })
              }}
            >
              ×
            </button>
          ) : null}
        </label>
        <button className="edit" onClick={() => setEdit(true)}>
          {text}
        </button>
        <div className="minis">
          <label className="mini">
            <span>W</span>
            <input
              onFocus={(e) => e.target.select()}
              type="number"
              min={1}
              max={8}
              value={column.width}
              onChange={(e) => {
                onChange({
                  ...column,
                  width: e.target.value,
                })
              }}
            />
          </label>
          <label className="mini">
            <span>X</span>
            <input
              onFocus={(e) => e.target.select()}
              type="number"
              value={column.left}
              onChange={(e) => {
                onChange({
                  ...column,
                  left: e.target.value,
                })
              }}
            />
          </label>
          <label className="mini">
            <span>Y</span>
            <input
              onFocus={(e) => e.target.select()}
              type="number"
              value={column.top}
              onChange={(e) => {
                onChange({
                  ...column,
                  top: e.target.value,
                })
              }}
            />
          </label>
        </div>
        <label>
          <input
            placeholder="class"
            type="text"
            value={column.className}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.target.blur()
              }
            }}
            onChange={(e) => {
              onChange({
                ...column,
                className: e.target.value || '',
              })
            }}
          />
        </label>
      </div>
    </div>
  )
}
