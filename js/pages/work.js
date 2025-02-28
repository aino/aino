import { create, style, q } from '@/js/utils/dom'
import fadeout from '@/js/fadeout'
import fadein from '@/js/fadein'
import { stopHoverChar } from '../hoverchar'
import { smoothScroll } from '../utils/scroll'

export const path = /^\/work$/

export default async function about(app) {
  const [bg] = q('.bg', app)
  bg.style.opacity = 0
  const [worktable] = q('.worktable', app)
  fadein(worktable)
  let pending = false
  for (const a of q('a', worktable)) {
    a.dataset.preventclick = 'true'
    a.addEventListener('mouseenter', () => {
      if (pending) {
        return
      }
      bg.style.opacity = 0.5
      bg.style.marginTop = Math.random() > 0.5 ? '-100vh' : '0'
    })
    const onLeave = () => {
      if (pending) {
        return
      }
      //bg.style.opacity = 0
    }
    a.addEventListener('mouseleave', onLeave)
    a.addEventListener('click', (e) => {
      pending = true
      bg.style.opacity = 0.5
      setTimeout(() => {
        bg.classList.add('out')
      }, 400)
      if (scrollY) {
        smoothScroll(0)
      }
      e.preventDefault()
      stopHoverChar()

      fadeout(
        worktable,
        (node) => {
          const nodeParent = node.parentNode.closest('a')
          const targetParent = e.target.closest('a')
          if (node.parentNode.nodeName === 'SPAN') {
            return true
          }
          if (nodeParent?.href === targetParent?.href) {
            return false
          }
          return true
        },
        () => {
          setTimeout(() => {
            history.pushState(null, '', a.href)
          }, 1000)
        }
      )
    })
  }
}
