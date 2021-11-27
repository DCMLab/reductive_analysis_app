/**
 * @todo This main menu, the filters menu and the metadata menu have in common
 * the same way to expand and collapse. It could be good to have a class in
 * ordet to do that (e.g. CollapsibleFlyOut extending the FlyOut class).
 */

import { savesvg, save_orig } from '../../../../app'

class MainMenu {
  constructor() {
    this.visible = false

    // DOM elements
    this.ctn = document.getElementById('main-menu')
    this.toggleBtn = document.getElementById('main-menu-toggle')
    this.selectFile = document.getElementById('score-file-picker')
    this.saveFile = document.getElementById('save-file')
    this.saveAsSvg = document.getElementById('save-file-svg')
  }

  onTap({ target }) {
    if (target == this.toggleBtn) {
      return this.toggle()
    }

    if (target == this.saveFile) {
      return save_orig()
    }

    if (target == this.saveAsSvg) {
      savesvg() // currently not working
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
