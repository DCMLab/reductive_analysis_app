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
    doc.classList.remove('loading')
    doc.classList.add('ready')

    this.viewport = viewport

    initEvents(this)

    // Modules below should be delayed to…

    // … when first score is loaded…
    this.ui = ui
    this.score = score
    this.player = player

    // … and when first action is done.
    this.history = history
  }
}

const app = new App()

export default app

// export default function initApp() {
//   new App()
// }
