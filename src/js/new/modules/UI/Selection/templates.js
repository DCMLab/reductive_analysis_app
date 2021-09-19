import { to_text } from '../../../../utils'
import score from '../../Score'

/**
 * Create a string filled of `<li>` matching a given selection.
 *
 * @param {HTMLElement[]} selection
 * @returns string
 */
export const createSelectionText = selection => {
  console.log(selection)
  const type = score.selectionType

  if (!selection.length) { return '-' }

  const items =
    type == 'note'
      ? to_text(selection).map(createSelectedNoteItem) // note
      : selection.map(createSelectedRelationItem) // relation or metarelation

  return items.join('')
}

const createSelectedNoteItem = note => `<li class="selection__listItem">${note}</li>`
const createSelectedRelationItem = el => `<li class="selection__listItem">${el.getAttribute('type')}</li>`
