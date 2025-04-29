import site from '@/js/stores/site'
import { q, create, update } from '@/js/utils/dom'
import ascii from '../ascii'
import pixelate from '../pixelate'

export const disableAdmin = () => {
  if (window.adminPopoutWindow) {
    window.adminPopoutWindow.document.documentElement.classList.add('disabled')
  }
  return () => {
    if (window.adminPopoutWindow) {
      window.adminPopoutWindow.document.documentElement.classList.remove(
        'disabled'
      )
    }
  }
}

export default async function admin(app, table, onRender) {
  const [sectionsNode] = q('.sections', app)
  if (!sectionsNode) {
    console.error('No sections node found')
    return
  }
  let destroyers = []
  const destroy = () => {
    for (const destroyer of destroyers) {
      destroyer()
    }
  }
  const slug = sectionsNode.dataset.slug
  const parseMedia = () => {
    const mode = site.value.mode
    destroy()
    for (const source of q('img, video', app)) {
      if (mode === 'text') {
        destroyers.push(ascii(source))
      } else if (mode === 'pixel') {
        destroyers.push(pixelate(source))
      }
    }
  }
  destroyers.push(
    site.subscribe((newValue, oldValue) => {
      if (newValue.mode !== oldValue.mode) {
        parseMedia()
      }
    })
  )
  if (site.value.session) {
    const { default: columns } = await import('partials/columns')
    const response = await fetch(`/api/get?table=${table}&slug=${slug}`)
    let data = await response.json()
    const render = () => {
      let html = ''
      for (const section of data.sections) {
        html += `<section class="section ${section.className}"${
          section.margin
            ? ' style="margin-top:calc(var(--line) * ' + section.margin + ')"'
            : ''
        }>${columns(section.columns)}</section>`
      }
      const clone = sectionsNode.cloneNode(true)
      clone.innerHTML = html
      update(sectionsNode, clone)
      if (onRender) {
        onRender(data)
      }
      // ectionsNode.innerHTML = html
      for (const fadeNode of q('.fadein', sectionsNode)) {
        fadeNode.style.opacity = 1
      }
      parseMedia()
    }
    render()

    const admin = create('div', { id: 'admin' })
    sectionsNode.before(admin)

    const setData = (newData) => {
      data = newData
      render()
    }

    Promise.all([
      import('react'),
      import('react-dom/client'),
      import('./App'),
    ]).then(([React, ReactDOM, AdminApp, AceEditor, _]) => {
      ReactDOM.createRoot(admin).render(
        React.createElement(AdminApp.default, {
          data,
          setData,
          sections: sectionsNode,
          slug,
          table,
        })
      )
    })
  }

  site.subscribe((newValue, oldValue) => {
    if (!newValue.session && oldValue.session) {
      const admin = document.getElementById('admin')
      if (admin) {
        admin.remove()
      }
    }
  })
  return () => destroy()
}
