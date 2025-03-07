import grid from '../grid/grid2'
import { q } from '../utils/dom'
import { lerp } from '../utils/animate'

export const path = /^\/careers\/[^/]+$/

export default async function position(app) {
  const destroyers = []

  return () => {
    destroyers.forEach((destroy) => destroy())
  }
}
