import React, { useState, useRef, useEffect } from 'react'
import Column from './Column'
import Input from './Input'

export default function Section({
  section,
  onChange,
  toggleOpen,
  open,
  confirmDialog,
}) {
  const [dragColumnIndex, setDragColumnIndex] = useState(null)
  const mouseDownTargetRef = useRef(null)
  const classInput = useRef(null)
  const [columnOpen, setColumnOpen] = useState([])

  const toggleColumnOpen = (index, force) => {
    const nextOpen = [...columnOpen]
    const i = columnOpen.indexOf(index)
    const shouldBeOpen = force === undefined ? i === -1 : force

    if (shouldBeOpen && i === -1) nextOpen.push(index)
    if (!shouldBeOpen && i > -1) nextOpen.splice(i, 1)
    setColumnOpen(nextOpen)
  }

  useEffect(() => {
    if (!open) {
      setColumnOpen([])
    }
  }, [open])

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
    if (
      open &&
      classInput.current &&
      classInput.current.value === '' &&
      !section.columns?.length
    ) {
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
            confirmDialog('Delete section?', () => onChange(null))
          }}
        >
          ×
        </button>
      </div>
      <div className="content">
        <div className="minis">
          <label>
            <Input
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
          <label className="mini" style={{ minWidth: '4rem' }}>
            <span>M</span>
            <Input
              type="number"
              min={-10}
              max={10}
              select={true}
              value={section.margin}
              onChange={(e) => {
                onChange({
                  ...section,
                  margin: e.target.value,
                })
              }}
            />
          </label>
        </div>
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
                toggleOpen={() => toggleColumnOpen(i)}
                open={columnOpen.includes(i)}
                column={column}
                confirmDialog={confirmDialog}
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
