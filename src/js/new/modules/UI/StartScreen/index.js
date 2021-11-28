import { load } from '../../../../app'

class StartScreen {
  constructor() {
    this.ctn = document.getElementById('start-screen')
    this.filePicker = document.getElementById('start-screen-score-file-picker')
    this.init()
  }

  init() {
    // Remove initial spinner from DOM.
    document.getElementById('start-screen-loading-spinner').remove()
  }

  onChange(e) {
    if (e.composedPath().includes(this.filePicker)) {
      load(e)
    }
  }

  destroy() {
    this.ctn.remove()
  }
}

const startScreen = new StartScreen()

export default startScreen
