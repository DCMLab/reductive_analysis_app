'use strict'

import { doc }    from './utils/document'
import initEvents from './events'
import player     from './modules/Player'
import ui         from './modules/UI'
import score      from './modules/Score'
import history    from './modules/History'
import viewport   from './modules/Viewport'

class App {
  constructor() {
    this.init()
  }

  init() {
    doc.classList.replace('loading', 'ready')

    this.viewport = viewport

    initEvents(this)

    // Modules below should be delayed to…

    // … when the first score is loaded…
    this.ui = ui
    this.score = score
    this.player = player

    // … and when a first action is done.
    this.history = history
  }
}

const app = new App()

export default app
