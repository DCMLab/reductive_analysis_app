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

  // Delete start screen HTML after fade-out.
  destroy() {
    this.ctn.addEventListener('transitionend', this.ctn.remove, { once: true })
    this.ctn.classList.add('start-screen--out')
  }
}

const startScreen = new StartScreen()

export default startScreen
