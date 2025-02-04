import { outQuad } from './easing'

export const lerp = (v0, v1, t) => v0 * (1 - t) + v1 * t

export const reverseLerp = (v0, v1, value) => {
  if (v0 === v1) return 0 // Avoid division by zero
  return (value - v0) / (v1 - v0)
}

const animate = ({
  duration = 400,
  easing = outQuad,
  onFrame,
  onComplete,
  onStart,
}) => {
  let stopped = false

  const returnObject = {
    /**
     * Stops the animation.
     */
    stop: () => {
      stopped = true
    },
  }

  const then = Date.now()

  /**
   * Animation loop.
   */
  function loop() {
    if (!stopped) {
      const time = Date.now() - then

      if (time === 0 && onStart) {
        onStart()
      }

      if (time > duration) {
        if (onComplete) {
          onComplete()
        }
      } else if (onFrame) {
        onFrame(easing(time / duration))
        requestAnimationFrame(loop)
      }
    }
  }

  loop()
  return returnObject
}

export default animate
