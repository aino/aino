import { create, style, q } from '@/js/utils/dom'

export const path = /^\/work$/

export default async function about(app) {
  const [bg] = q('.bg', app)
  bg.style.opacity = 0
  const [worktable] = q('.worktable', app)
  for (const a of q('a', worktable)) {
    a.addEventListener('mouseenter', () => {
      bg.style.opacity = 0.5
      bg.style.marginTop = Math.random() > 0.5 ? '-100vh' : '0'
    })
    a.addEventListener('mouseleave', () => {
      bg.style.opacity = 0
    })
  }
}
