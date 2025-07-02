export default class SelectionMode {
  constructor() {
    this.primary = document.getElementById('selection-mode-primary')
    this.secondary = document.getElementById('selection-mode-secondary')
  }

  set(mode) {
    this.mode = mode
    this.updateBtns()
  }

  // on keypress or radio checked
  updateBtns() {
    this[this.mode].checked = true
  }

  onChange({ target }) {
    if (target.name == 'selection-mode') {
      this.set(target.value)
    }
  }
}
