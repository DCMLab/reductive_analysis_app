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
    if (context) {
      select_visibles(context)
    }
  }

  selectNone() {
    do_deselect()
  }

  onTap({ target }) {
    if (target == this.selectBtn) { return this.selectAll() }
    if (target == this.unselectBtn) { return this.selectNone() }
  }
}

const selection = new Selection()

export default selection
