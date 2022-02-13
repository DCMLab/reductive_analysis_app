import startScreen from './StartScreen'
import mainMenu   from './MainMenu'
import filters    from './Filters'
import metadata   from './Metadata'
import navigation from './Navigation'
import relations  from './Relations'
import selection  from './Selection'
import zoom       from './Zoom'
import newNote    from './Note'
import relationWidth from './RelationWidth'
import scoreSettings from './Score'
import layersMenu  from './LayersMenu'

class UI {
  constructor() {
    this.ctn = document.getElementById('ui')
    this.init()
  }

  onTap(e) {
    this.relations?.onTap(e)
    this.scoreSettings?.onTap(e)

    if (!e.composedPath().includes(this.ctn)) { return }

    this.mainMenu?.onTap(e)
    this.zoom?.onTap(e)
    this.selection?.onTap(e)
    this.metadata?.onTap(e)
    this.navigation?.onTap(e)
    this.filters?.onTap(e)
    this.newNote?.onTap(e)
    this.layersMenu?.onTap(e)
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
    this.metadata?.onScoreLoad(e)
  }

  onScoreSelection({ detail }) {
    this.selection?.onScoreSelection(detail)
    this.relations?.onScoreSelection()
  }

  init() {
    this.startScreen = startScreen
    this.mainMenu = mainMenu
    this.zoom = zoom
    this.selection = selection
    this.navigation = navigation
    this.metadata = metadata
    this.filters = filters
    this.relations = relations
    this.newNote = newNote
    this.relationWidth = relationWidth
    this.scoreSettings = scoreSettings
    this.layersMenu = layersMenu
  }
}

const ui = new UI()

export default ui
