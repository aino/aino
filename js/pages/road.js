import grid from '@/js/grid/grid2'
import { q, id } from '@/js/utils/dom'

export const path = /^\/road\/?$/

export default async function checkers(app) {
  const [gridNode] = q('.grid')
  const nav = id('nav')
  nav.style.opacity = '0'

  const { dimensions, startRenderLoop, stopRenderLoop, createPoint } =
    grid(gridNode)

  let main = []
  // This offset will be incremented each frame.
  let scrollOffset = 0
  // Adjust speed to taste (rows per second).
  const scrollSpeed = 20

  let startY = 0.5
  let horizon = 0.5

  addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      horizon += 0.01
    } else if (e.key === 'ArrowLeft') {
      horizon -= 0.01
    } else if (e.key === 'ArrowDown') {
      startY += 0.01
    } else if (e.key === 'ArrowUp') {
      startY -= 0.01
    }
  })

  const rafId = startRenderLoop(main, (delta) => {
    // `delta` is milliseconds since last frame, so convert to seconds.
    const dt = delta / 1000
    // Increase the offset so it moves down over time.
    scrollOffset -= dt * scrollSpeed

    // Pick a tile size that feels right for your terminal size.
    const tileSize = Math.round(dimensions.cols / 12)

    const points = []
    for (
      let row = Math.floor(dimensions.rows * startY);
      row < dimensions.rows;
      row++
    ) {
      // “boardRow” is the row index we use for checker math, shifted by scrollOffset.
      const boardRow = row + scrollOffset

      for (let col = 0; col < dimensions.cols; col++) {
        const boardCol = col

        // Compute which big-tile block we are in horizontally.
        // e.g. floor(boardCol / tileSize) => which tile column
        const tileCol = Math.floor(boardCol / tileSize)
        // Same vertically, but using boardRow for scrolling:
        const tileRow = Math.floor((boardRow / tileSize) * 3)

        // Now figure out whether we’re on the “light” or “dark” tile.
        // You can use (tileCol + tileRow) % 2 or do further subdividing for patterns.
        const checkerValue = (tileCol + tileRow) % 2

        // Example: if checkerValue == 0 => “N”, else “·”
        const value = checkerValue === 0 ? 'N' : '·'

        const y = row / dimensions.rows
        let x = col / dimensions.cols

        x = horizon + (y - startY) * (1 / (1 - startY)) * (x - horizon)

        points.push(
          createPoint({
            x,
            y,
            value: value,
          })
        )
      }
    }

    main = points
    return points
  })

  return () => {
    if (rafId) {
      stopRenderLoop(rafId)
    }
  }
}
