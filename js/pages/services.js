import grid from '../grid/grid3'
import { lerp } from '../utils/animate'
import { create, q } from '../utils/dom'
import { grayRamp } from '../ascii'
import admin from '../admin/admin'

export const path = /^\/services$/

export default async function about(app) {
  const [gridNode] = q('.grid', app)
  const { listen, createPoint, destroy, render, applyPhysics, dimensions } =
    grid(gridNode)
  const destroyers = [destroy]
  let main = []
  const getValue = (timestamp, duration) => {
    const t = (timestamp % duration) / duration
    return (1 - Math.cos(2 * Math.PI * t)) / 2
  }
  destroyers.push(await admin(app, 'pages'))
  listen('frame', ({ timestamp }) => {
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
