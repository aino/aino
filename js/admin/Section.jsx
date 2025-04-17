import React, { useState, useRef, useEffect } from 'react'
import Column from './Column'

export default function Section({ section, onChange, toggleOpen, open }) {
  const [dragColumnIndex, setDragColumnIndex] = useState(null)
  const mouseDownTargetRef = useRef(null)
  const classInput = useRef(null)

  const handleColumnDragStart = (index, e) => {
    const target = mouseDownTargetRef.current
    if (
      target &&
      target.closest('input, textarea, select, [contenteditable]')
    ) {
      e.preventDefault()
      return
    }

    e.stopPropagation()
    setDragColumnIndex(index)
  }

  const handleColumnDragOver = (index, e) => {
    e.preventDefault()
    if (dragColumnIndex === null || dragColumnIndex === index) return

    const updatedColumns = [...section.columns]
    const [removed] = updatedColumns.splice(dragColumnIndex, 1)
    updatedColumns.splice(index, 0, removed)

    setDragColumnIndex(index)
    onChange({
      ...section,
      columns: updatedColumns,
    })
  }

  const handleColumnDragEnd = () => {
    setDragColumnIndex(null)
  }

  useEffect(() => {
    if (open && classInput.current && classInput.current.value === 'free') {
      classInput.current.focus()
      classInput.current.select()
    }
  }, [open])

  return (
    <div className={['section', open ? 'open' : ''].join(' ')}>
      <div className="title">
        <button className="ghost" onClick={toggleOpen}>
          <span>›</span>
          <span>
            Section <i>{section.columns?.length || 0}</i>
          </span>
        </button>
        <button
          title="Delete section"
          className="delete small ghost"
          onClick={(e) => {
            window.confirm('Delete section?') && onChange(null)
          }}
        >
          ×
        </button>
      </div>
      <div className="content">
        <label>
          <input
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.target.blur()
              }
            }}
            ref={classInput}
            className="sectionclass"
            type="text"
            placeholder="class"
            value={section.className}
            onChange={(e) => {
              onChange({
                ...section,
                className: e.target.value,
              })
            }}
          />
        </label>
        {section.columns?.map((column, i) => {
          return (
            <div
              key={i}
              draggable
              onMouseDown={(e) => {
                mouseDownTargetRef.current = e.target
              }}
              onDragStart={(e) => handleColumnDragStart(i, e)}
              onDragOver={(e) => handleColumnDragOver(i, e)}
              onDragEnd={handleColumnDragEnd}
              style={{
                opacity: dragColumnIndex === i ? 0.3 : 1,
                cursor: 'move',
              }}
            >
              <Column
                column={column}
                onChange={(e) => {
                  const newColumns = section.columns.map((c, j) => {
                    if (i === j) {
                      return e
                    }
                    return c
                  })
                  onChange({
                    ...section,
                    columns: newColumns,
                  })
                }}
              />
            </div>
          )
        })}
        <button
          className="addcolumn ghost"
          onClick={() => {
            onChange({
              ...section,
              columns: [
                ...(section.columns || []),
                {
                  className: '',
                },
              ],
            })
          }}
        >
          <span>+</span>
          <span>Add Column</span>
        </button>
      </div>
    </div>
  )
}
