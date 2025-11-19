/**
 * @todo This main menu, the filters menu and the metadata menu have in common
 * the same way to expand and collapse. It could be good to have a class in
 * order to do that (e.g. CollapsibleFlyOut extending the FlyOut class).
 */

import { load, save_svg, save_mei, save_txt } from '../../../bootstrap'

class MainMenu {
  constructor() {
    this.visible = false

    // DOM elements
    this.ctn = document.getElementById('main-menu')
    this.toggleBtn = document.getElementById('main-menu-toggle')

    // File actions
    this.filePicker = document.getElementById('score-file-picker')
    this.saveFile = document.getElementById('save-file')
    this.saveAsSvg = document.getElementById('save-file-svg')
    this.saveAsTxt = document.getElementById('save-graph-txt')
  }

  onTap({ target }) {
    if (target == this.toggleBtn) {
      return this.toggle()
    }

    if (target == this.saveFile) {
      return save_mei()
    }

    if (target == this.saveAsSvg) {
      save_svg()
    }

    if (target == this.saveAsTxt) {
      save_txt()
    }
  }

  onChange(e) {
    if (e.composedPath().includes(this.filePicker)) {
      load(e)
      this.toggle(false)
    }
  }

  toggle(state = !this.visible) {
    this.visible = state
    this.ctn.classList.toggle('fly-out--expanded', state)
    this.ctn.classList.toggle('fly-out--collapsed', !state)
  }
}

const mainMenu = new MainMenu()

export default mainMenu
