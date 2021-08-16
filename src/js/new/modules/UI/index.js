import zoom from './Zoom'
import selection from './Selection'
import initNavigation from './Navigation'

class UI {
  constructor() {
    this.ctn = document.getElementById('ui')
    this.init()
  }

  onTap(e) {
    if (!e.composedPath().includes(this.ctn)) { return }

    this.zoom?.onTap(e)
    this.selection?.onTap(e)
    this.navigation?.onTap(e)
  }

  onResize() {
    this.computeValues()
  }

  computeValues() {
    this.wW = window.innerWidth
  }

  init() {
    this.computeValues()

    this.zoom = zoom
    this.selection = selection
    this.navigation = initNavigation(this)
  }
}

const ui = new UI()

export default ui
