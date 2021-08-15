import filters    from './Filters'
import navigation from './Navigation'
import relations  from './Relations'
import selection  from './Selection'
import zoom       from './Zoom'

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
    this.relations?.onTap(e)
  }

  onMouseDown(e) {
    this.relations?.onMouseDown(e)
  }

  onMouseMove(x, y) {
    this.relations?.onMouseMove(x, y)
  }

  onMouseUp(e) {
    this.relations?.onMouseUp(e)
  }

  onResize() {
    this.relations?.onResize()
  }

  onScoreLoad(e) {
    this.filters?.onScoreLoad(e)
  }

  init() {
    this.zoom = zoom
    this.selection = selection
    this.navigation = navigation
    this.filters = filters
    this.relations = relations
  }
}

const ui = new UI()

export default ui
