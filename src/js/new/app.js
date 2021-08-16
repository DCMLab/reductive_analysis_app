'use strict'

import { doc } from './utils/document'
import initEvents from './events'
import player from './modules/Player'
import ui from './modules/UI'

class App {
  constructor() {
    this.init()
  }

  init() {
    doc.classList.remove('loading')
    doc.classList.add('ready')

    initEvents(this)

    this.player = player
    this.ui = ui
  }
}

const app = new App()

export default app

// export default function initApp() {
//   new App()
// }
