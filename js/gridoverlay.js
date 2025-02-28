import { create, style, getCssVariable } from '@js/utils/dom'

export default function gridoverlay() {
  const aa = create('div', { id: 'grid' }, document.body)
  style(aa, {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    opacity: 0,
    zIndex: 100,
    pointerEvents: 'none',
    wordBreak: 'break-all',
    overflow: 'hidden',
  })
  const cols = getCssVariable('cols')
  const rows = getCssVariable('rows')
  new ResizeObserver(() => {
    aa.textContent = new Array(cols * rows).fill('A').join('')
  }).observe(aa)
}
