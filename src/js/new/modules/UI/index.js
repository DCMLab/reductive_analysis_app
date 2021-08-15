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
    this.relations?.onTap(e)

    if (!e.composedPath().includes(this.ctn)) { return }

    this.zoom?.onTap(e)
    this.selection?.onTap(e)
    this.navigation?.onTap(e)
    this.filters?.onTap(e)
  }

  /**
   * Common handlers for touch and mouse events.
   */

  // touchstart, mousedown
  onTapStart(e) {
    this.relations?.onTapStart(e)
  }

  // touchmove, mousemove
  onTapMove(x, y) {
    this.relations?.onTapMove(x, y)
  }

  // touchend, mouseup
  onTapEnd() {
    this.relations?.onTapEnd()
  }

  // Other events

  onResize() {
    this.relations?.onResize()
  }

  onScoreLoad(e) {
    this.filters?.onScoreLoad(e)
  }

  onScoreSelection({ detail }) {
    if (detail.selected.concat(detail.extraselected).length > 0) {
      this.relations?.toggleVisibility(true)
    }
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
