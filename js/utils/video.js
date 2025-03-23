export const isVideoPlaying = (video) =>
  !!(
    video.currentTime > 0 &&
    !video.paused &&
    !video.ended &&
    video.readyState > 2
  )

export default function onVideoFrame(video, cb) {
  if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
    const onFrame = () => {
      cb()
      video.requestVideoFrameCallback(onFrame)
    }
    if (isVideoPlaying(video)) {
      video.requestVideoFrameCallback(onFrame)
    } else {
      video.addEventListener('play', () => {
        video.requestVideoFrameCallback(onFrame)
      })
    }
  } else {
    let lastTime = 0

    function onVideoFrameFallback() {
      if (!video.paused && !video.ended) {
        const currentTime = video.currentTime

        // Check if enough time has advanced that we can treat it as a new frame
        // (you can fine-tune how sensitive you want this to be)
        if (Math.abs(currentTime - lastTime) >= 0.016) {
          lastTime = currentTime
          requestAnimationFrame(onVideoFrameFallback)
        }
      }
    }
    if (isVideoPlaying(video)) {
      requestAnimationFrame(onVideoFrameFallback)
    } else {
      video.addEventListener('play', () => {
        requestAnimationFrame(onVideoFrameFallback)
      })
    }
  }
}
