/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/
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
