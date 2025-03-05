import { create, style, q } from '@/js/utils/dom'
import fadeout from '@/js/fadeout'
import fadein from '@/js/fadein'
import { stopHoverChar } from '../hoverchar'
import { smoothScroll } from '../utils/scroll'
import site from '@/js/stores/site'

export const path = /^\/work$/

const isTextMode = () => document.documentElement.classList.contains('textmode')

export default async function about(app) {
  const destroyers = []
  const [bg] = q('.bg', app)
  const [worktable] = q('.worktable', app)
  fadein(worktable)
  const [h1] = q('h1', app)
  document.documentElement.classList.add('dark')
  setTimeout(() => {
    fadein(h1)
  }, 400)
  let pending = false
  const items = q('li', worktable)
  destroyers.push(
    site.subscribe((nextValue) => {
      if (nextValue.textMode) {
        bg.classList.remove('hover')
      }
    })
  )
  for (let i = 0; i < items.length; i++) {
    const [a] = q('a', items[i])
    if (a) {
      a.dataset.preventclick = 'true'
      a.addEventListener('mouseenter', () => {
        if (pending || isTextMode()) {
          return
        }
        bg.classList.add('hover')
        bg.style.marginTop = `${i * -100}vh`
      })
      a.addEventListener('click', (e) => {
        if (!isTextMode()) {
          pending = true
          bg.classList.add('hover')
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
        } else {
          e.preventDefault()
          history.pushState(null, '', a.href)
        }
      })
    }
  }
  return () => {
    destroyers.forEach((destroy) => destroy())
    document.documentElement.classList.remove('dark')
  }
}
