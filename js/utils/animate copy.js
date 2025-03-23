export const lerp = (v0, v1, t) => v0 * (1 - t) + v1 * t

export const reverseLerp = (v0, v1, value) => {
  if (v0 === v1) return 0 // Avoid division by zero
  return (value - v0) / (v1 - v0)
}

export default async function animate(duration, onFrame) {
  return new Promise((resolve) => {
    const then = Date.now()

    function loop() {
      const elapsed = Date.now() - then

      if (elapsed >= duration) {
        resolve()
      } else if (onFrame) {
        onFrame(elapsed / duration)
        requestAnimationFrame(loop)
      }
    }

    requestAnimationFrame(loop)
  })
}
