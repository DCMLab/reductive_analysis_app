import score from '../../Score'
import { FlyOut } from '../FlyOut'
import { createSelectionText } from './templates'

/**
 * This class displays the list of selected notes, relations or metarelations
 * in a dedicated fly-out.
 */
export default class SelectionLegend extends FlyOut {
  constructor() {
    super('selection-legend')
    this.title = document.getElementById('selection-type')

    this.primary = document.getElementById('selection-primary')
    this.primaryList = document.getElementById('selection-list-primary')

    this.secondary = document.getElementById('selection-secondary')
    this.secondaryList = document.getElementById('selection-list-secondary')

    this.hide()
  }

  update({ selected, extraselected }) {
    this.toggleVisibility(score.hasSelection)

    if (this.visible) {
      this.updateTitle()
      this.updateRow('primary', selected)
      this.updateRow('secondary', extraselected)
    }
  }

  updateTitle() {
    this.title.innerHTML = score.selectionType ? `Selected ${score.selectionType}s` : 'Selection is empty'
  }

  updateRow(name, selection) {
    this[name].classList.toggle('none', !selection.length)
    this[`${name}List`].innerHTML = createSelectionText(selection)
  }
}
