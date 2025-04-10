import footer from './footer'
import header from './header'
import site from './stores/site'

export async function pageTransition(oldApp, newApp) {
  oldApp.replaceWith(newApp)
  scrollTo(0, 0)
}

export default async function main() {
  const html = document.documentElement
  const setAppearance = () => {
    html.classList.toggle('dark', site.value.appearance === 'dark')
    html.classList.toggle('light', site.value.appearance === 'light')
  }
  site.subscribe(setAppearance)
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      site.assign({ appearance: e.matches ? 'dark' : 'light' })
    })
  setAppearance()
  footer()
  header()
}
