import grid from '../grid/grid3'
import { lerp } from '../utils/animate'
import { create, q } from '../utils/dom'
import { grayRamp } from '../ascii'

export const path = /^\/services$/

export default function about(app) {
  const [gridNode] = q('.grid', app)
  const { listen, createPoint, destroy, render, applyPhysics, dimensions } =
    grid(gridNode)
  const destroyers = [destroy]
  let main = []
  const getValue = (timestamp, duration) => {
    const t = (timestamp % duration) / duration
    return (1 - Math.cos(2 * Math.PI * t)) / 2
  }
  let fadeIndex = 1
  listen('frame', ({ timestamp, delta }) => {
    let animation = []
    for (let r = 0; r < dimensions.rows; r++) {
      for (let i = 0; i < 2; i++) {
        const timeValue = getValue(timestamp, 10000)
        const ms = timestamp + r * lerp(20, 200, timeValue)
        const mainValue = getValue(ms, 2000)
        const charValue = getValue(timestamp, 4000)
        animation.push(
          createPoint({
            x: i ? 0.5 - mainValue / 2 : mainValue / 2,
            y: r / dimensions.rows,
            context: 'animation',
            value:
              grayRamp[
                Math.floor(
                  lerp(12, grayRamp.length - 2, i ? 1 - charValue : charValue)
                )
              ],
          })
        )
      }
    }
    main = [...animation]
    applyPhysics(main)
    render(main)
  })
  return () => {
    destroyers.forEach((destroy) => destroy())
  }
}
