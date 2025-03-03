import footer from './footer'
import header from './header'

export async function pageTransition(oldApp, newApp) {
  oldApp.replaceWith(newApp)
  scrollTo(0, 0)
}

export default async function main() {
  footer()
  header()
}
