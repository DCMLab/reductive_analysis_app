import { naturalize_note } from '../../../../accidentals'
import { toggle_selected } from '../../../../ui'
import { draw_context_of } from '../../../../utils'
import score from '../../Score'

// Accidentals can only be changed on an editable layer.

class Accidentals {
  onTap({ target }) {
    if (target == this.btn) {
      this.naturalize()
    }
  }

  naturalize() {
    if (
      score.selectionType == 'note'
      && draw_context_of(score.flatSelection[0]).canEdit
    ) {
      score.flatSelection.forEach(naturalize_note)
      score.flatSelection.forEach(toggle_selected)
    }
  }

  init() {
    this.btn = document.getElementById('naturalize-note')
  }
}

const accidentals = new Accidentals()

export default accidentals
