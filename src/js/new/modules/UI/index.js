import zoom from './Zoom'

class UI {
  constructor() {
    this.ctn = document.getElementById('ui')
    this.init()
  }

  onTap(e) {
    if (!e.composedPath().includes(this.ctn)) { return }

    this.zoom?.onTap(e)
  }

  init() {
    this.zoom = zoom
  }
}

const ui = new UI()

export default ui
