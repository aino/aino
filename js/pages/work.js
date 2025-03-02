import { create, style, q } from '@/js/utils/dom'
import fadeout from '@/js/fadeout'
import fadein from '@/js/fadein'
import { stopHoverChar } from '../hoverchar'
import { smoothScroll } from '../utils/scroll'
import wait from '@/js/utils/wait'

export const path = /^\/work$/

export default async function about(app) {
  const [bg] = q('.bg', app)
  bg.style.opacity = 0
  const [worktable] = q('.worktable', app)
  fadein(worktable)
  const [h1] = q('h1', app)
  setTimeout(() => {
    fadein(h1)
  }, 400)
  let pending = false
  const items = q('li', worktable)
  for (let i = 0; i < items.length; i++) {
    const [a] = q('a', items[i])
    if (a) {
      a.dataset.preventclick = 'true'
      a.addEventListener('mouseenter', () => {
        if (pending) {
          return
        }
        bg.style.opacity = 0.5
        bg.style.marginTop = `${i * -100}vh`
      })
      const onLeave = () => {
        if (pending) {
          return
        }
        // bg.style.opacity = 0
      }
      a.addEventListener('mouseleave', onLeave)
      a.addEventListener('click', (e) => {
        pending = true
        bg.style.opacity = 0.5
        setTimeout(() => {
          bg.classList.add('out')
        }, 200)
        if (scrollY) {
          smoothScroll(0)
        }
        e.preventDefault()
        stopHoverChar()
        fadeout(h1)
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
            history.pushState(null, '', a.href)
          }
        )
      })
    }
  }
}
