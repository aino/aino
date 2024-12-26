import { createFromString, q, update } from '@/js/utils/dom'
import { clone } from '@/js/utils/object'

export default async function sections(app) {
  const [node] = q('.sections', app)
  if (!node) {
    return
  }

  const { default: template } = await import('partials/sections')

  const slug = location.pathname.split('/').filter(Boolean).pop()
  const getData = async () => {
    const response = await fetch(`/api/data?type=work&slug=${slug}`)
    return await response.json()
  }

  const render = ({ sections }) => {
    update(node, template({ sections }))
    let row = 0
    let col = 0
    for (const section of q('section', node)) {
      for (const column of section.children) {
        Object.assign(column.dataset, { row, col })
        if (column.classList.contains('html')) {
          column.setAttribute('contenteditable', true)
        }
        col++
      }
      row++
    }
  }

  let original = await getData()
  let draft = clone(original)

  render(original)

  document.execCommand('defaultParagraphSeparator', false, 'p')

  const controls = createFromString(`
  <div class="controls">
    <button name="save">Save</button>
    <button name="revert">Revert</button>
  </div>`)

  controls.addEventListener('click', async (e) => {
    if (e.target.name === 'save') {
      const response = await fetch(`/api/data`, {
        method: 'POST',
        body: JSON.stringify({
          type: 'work',
          slug,
          data: draft,
        }),
      })
      if (response.ok) {
        console.log('saved')
        original = await response.json()
        draft = clone(original)
        render(original)
      } else {
        console.error('failed to save')
      }
    } else if (e.target.name === 'revert') {
      console.log('rendering', original)
      render(original)
    }
  })

  node.before(controls)

  const onInput = (e) => {
    const { row, col } = e.target.dataset
    const html = e.target.innerHTML
    if (draft.sections?.[row]?.columns) {
      draft.sections[row].columns[col].html = html
    }
  }

  node.addEventListener('input', onInput)

  return () => {
    node.removeEventListener('input', onInput)
    controls.remove()
  }
}
