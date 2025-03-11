import ascii from './ascii'
import hoverchar from './hoverchar'
import { fitHeight } from './pages/global'
import { create, q } from './utils/dom'
import contacts from '@/data/contacts'

export default async function email(link) {
  const { href } = link
  const email = href.replace('mailto:', '')
  const contact = contacts.find((c) => c.email === email)
  if (!contact) {
    return
  }
  let container
  const onClick = (e) => {
    e.preventDefault()

    container = create('div')
    container.innerHTML = emailTemplate(contact)
    link.after(container)
    const [img] = q('img', container)
    if (document.documentElement.classList.contains('textmode')) {
      container.style.opacity = 0
      fitHeight(img.parentElement)
      ascii(img)
      setTimeout(() => {
        container.style.opacity = 1
      }, 100)
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
  const { default: emailTemplate } = await import('partials/email')
  link.addEventListener('click', onClick)
  return () => {
    container?.remove()
    link.removeEventListener('click', onClick)
  }
}
