import {
  do_deselect,
  getCurrentDrawContext,
  select_visibles
} from '../../../../ui'

class Selection {
  constructor() {
    this.selectBtn = document.getElementById('select-all')
    this.unselectBtn = document.getElementById('unselect-all')
  }

  selectAll() {
    const context = getCurrentDrawContext()
    if (!context) { return }

    select_visibles(context)
  }

  clear() {
    do_deselect()
  }

  onTap({ target }) {

    // Select all

    if (target == this.selectBtn) {
      this.selectAll()
      return
    }

    // Clear selection

    if (target == this.unselectBtn) {
      this.clear()
      return
    }
  }
}

const selection = new Selection()

export default selection
