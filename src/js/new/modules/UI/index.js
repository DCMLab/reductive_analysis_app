import filters        from './Filters'
import initNavigation from './Navigation'
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
    this.computeValues()
  }

  onScoreLoad(e) {
    this.filters?.onScoreLoad(e)
  }

  computeValues() {
    this.wW = window.innerWidth
  }

  init() {
    this.computeValues()

    this.zoom = zoom
    this.selection = selection
    this.navigation = initNavigation(this)
    this.filters = filters
  }
}

const ui = new UI()

export default ui
