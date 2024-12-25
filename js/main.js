import animate from './utils/animate'
import { style, update } from './utils/dom'

export async function pageTransition(oldApp, newApp) {
  oldApp.replaceWith(newApp)
  scrollTo(0, 0)
}

export default async function main() {}
