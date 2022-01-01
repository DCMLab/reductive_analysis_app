import {
  do_deselect,
  getCurrentDrawContext,
  select_visibles
} from '../../../../ui'
import SelectionLegend from './legend'
import SelectionMode from './mode'

class Selection {
  constructor() {
    this.selectBtn = document.getElementById('select-all')
    this.unselectBtn = document.getElementById('unselect-all')
    this.legend = new SelectionLegend() // rename it?
    this.mode = new SelectionMode() // rename it?
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

  onScoreSelection(detail) {
    this.legend.update(detail)
  }
}

const selection = new Selection()

export default selection
