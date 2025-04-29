import React, { useState, useMemo, useRef } from 'react'
import { stripHtml } from '../utils/string'
import Input from './Input'

import AceEditor from 'react-ace'
import 'ace-builds/src-noconflict/mode-html'
import 'ace-builds/src-noconflict/theme-monokai'
import 'ace-builds/src-noconflict/ext-language_tools'

function cleanHTML(dirtyHTML) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(dirtyHTML, 'text/html')
  return doc.body.innerHTML.trim() // cleaned and normalized
}

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
        const video = document.createElement('video')
        video.preload = 'metadata'

        video.onloadedmetadata = function () {
          const width = video.videoWidth
          const height = video.videoHeight
          onChange({
            ...column,
            video: {
              file,
              url: dataURL,
              width,
              height,
            },
            image: null,
          })
        }
        video.src = dataURL
      } else if (file.type.startsWith('image/')) {
        // Image upload
        const img = new Image()
        img.onload = function () {
          const { width, height, src: url } = img
          onChange({
            ...column,
            image: {
              file,
              url,
              width,
              height,
            },
            video: null,
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
    if (!name) return 'image or video'
    return name.url.slice(0, 17).toLowerCase() + '...'
  }, [column.image, column.video])

  const text = useMemo(() => {
    if (column.html) {
      return stripHtml(column.html).slice(0, 17) + '...'
    }
    return 'html'
  })

  const getWindow = () => window.adminPopoutWindow || window

  return (
    <div
      className={['column', open ? 'open' : '', edit ? 'coledit' : ''].join(
        ' '
      )}
    >
      <div className="title">
        <button className="ghost" onClick={() => setData(!open)}>
          <span>›</span>
          <span>Column</span>
        </button>
        <button
          title="Delete column"
          className="delete small ghost"
          onClick={(e) => {
            if (getWindow().confirm('Delete column?')) {
              e.stopPropagation()
              onChange(null)
            }
          }}
        >
          ×
        </button>
      </div>
      <div className="content">
        <div className="minis">
          <label className="mini">
            <span>W</span>
            <Input
              type="number"
              min={1}
              max={8}
              select={true}
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
            <Input
              type="number"
              value={column.left}
              select={true}
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
            <Input
              type="number"
              value={column.top}
              select={true}
              onChange={(e) => {
                onChange({
                  ...column,
                  top: e.target.value,
                })
              }}
            />
          </label>
        </div>
        <label
          className={[
            'file',
            !(column.image || column.video) ? 'placeholder' : '',
          ].join(' ')}
        >
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
        <button
          className={['edit', !column.html ? 'placeholder' : ''].join(' ')}
          onClick={() => setEdit(true)}
        >
          {text}
        </button>

        <label>
          <Input
            placeholder="class"
            type="text"
            value={column.className}
            onChange={(e) => {
              onChange({
                ...column,
                className: e.target.value || '',
              })
            }}
          />
        </label>
      </div>
      {edit ? (
        <div className="texteditor">
          {/*}
          <textarea
            autoFocus
            onChange={(e) => {
              const value = e.target.value
              onChange({
                ...column,
                html: cleanHTML(value),
              })
            }}
            defaultValue={column.html}
          ></textarea>
          */}
          <AceEditor
            placeholder="HTML"
            mode="html"
            theme="monokai"
            name="blah2"
            fontSize={11}
            lineHeight={14}
            showPrintMargin={false}
            showGutter={false}
            highlightActiveLine={false}
            wrapEnabled={true}
            onChange={(value) => {
              onChange({
                ...column,
                html: cleanHTML(value),
              })
            }}
            defaultValue={column.html}
            setOptions={{
              enableBasicAutocompletion: true,
              enableLiveAutocompletion: false,
              enableSnippets: true,
              enableMobileMenu: false,
              showLineNumbers: false,
              tabSize: 2,
            }}
          />

          <button onClick={() => setEdit(false)}>
            <span>Done</span>
          </button>
        </div>
      ) : null}
    </div>
  )
}
