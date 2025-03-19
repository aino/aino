import ascii from './ascii'
import hoverchar from './hoverchar'
import pixelate from './pixelate'
import { create, q } from './utils/dom'
import contacts from '@/data/contacts'

const html = document.documentElement

export default async function email(link) {
  const destroyers = []
  const { href } = link
  const email = href.replace('mailto:', '')
  const contact = contacts.find((c) => c.email === email)
  if (!contact) {
    return
  }
  let container
  const { default: emailTemplate } = await import('partials/email')
  const onClick = (e) => {
    e.preventDefault()

    container = create('div')
    container.innerHTML = emailTemplate(contact)
    link.after(container)
    const [img] = q('img', container)
    const textmode = html.classList.contains('textmode')
    const pixelmode = html.classList.contains('pixelmode')
    if (textmode || pixelmode) {
      if (textmode) {
        destroyers.push(ascii(img))
      } else if (pixelmode) {
        destroyers.push(pixelate(img))
      }
    }
    for (const closer of q('button.close, .backdrop', container)) {
      closer.addEventListener('click', (e) => {
        console.log(e.target, e.currentTarget)
        e.preventDefault()
        container.remove()
      })
    }
    const [gmail] = q('.gmail', container)
    gmail.addEventListener('click', (e) => {
      e.preventDefault()
      window.open(e.target.href, '_blank')
    })
    const [copy] = q('.copy', container)
    copy.addEventListener('click', (e) => {
      e.preventDefault()
      navigator.clipboard.writeText(email)
      copy.replaceWith('→ Address copied')
    })
    addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'Escape') {
          container.remove()
        }
      },
      { once: true }
    )
    hoverchar(container)
  }
  link.addEventListener('click', onClick)
  destroyers.push(() => link.removeEventListener('click', onClick))
  destroyers.push(() => container?.remove())
  return () => {
    for (const destroy of destroyers) {
      destroy()
    }
  }
}
