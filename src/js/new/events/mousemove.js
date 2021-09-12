let queuedCallback = null

const props = {
  x: 0,
  y: 0,
}

class MouseMoveTick {
  /**
   * This throttling technique (described on
   * https://nolanlawson.com/2019/08/11/high-performance-input-handling-on-the-web)
   * makes sure the executed callback receives the most recent layout values.
   */
  tick({ x, y }, callback) {
    if (!queuedCallback) {

      /**
       * A High resolution timestamp could be used to throttle to less FPS.
       * Otherwise, it follows the screen refresh rate.
       * https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
       */
      window.requestAnimationFrame(highResolutionTimestamp => {
        this.update(x, y)

        // Use the most recently queued callback and empty the queue.
        const cb = queuedCallback
        queuedCallback = null
        cb(props)
      })
    }

    // Queue the callback.
    queuedCallback = callback
  }

  update(x, y) {
    props.x = x
    props.y = y
  }
}

const mouseMoveTick = new MouseMoveTick()

export default mouseMoveTick
