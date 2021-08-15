import filters        from './Filters'
import navigation from './Navigation'
import selection      from './Selection'
import zoom           from './Zoom'

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
    this.filters?.onTap(e)
  }

  onResize() {
  }

  onScoreLoad(e) {
    this.filters?.onScoreLoad(e)
  }

  init() {
    this.zoom = zoom
    this.selection = selection
    this.navigation = navigation
    this.filters = filters
  }
}

const ui = new UI()

export default ui
