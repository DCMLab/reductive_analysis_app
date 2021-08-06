import zoom from './Zoom'
import selection from './Selection'

class UI {
  constructor() {
    this.ctn = document.getElementById('ui')
    this.init()
  }

  onTap(e) {
    if (!e.composedPath().includes(this.ctn)) { return }

    this.zoom?.onTap(e)
    this.selection?.onTap(e)
  }

  init() {
    this.zoom = zoom
    this.selection = selection
  }
}

const ui = new UI()

export default ui
