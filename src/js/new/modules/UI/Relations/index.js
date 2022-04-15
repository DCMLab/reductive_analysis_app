import {
  do_relation,
  do_metarelation,
  do_comborelation,
} from '../../../../app'

import { delete_relations } from '../../../../delete'

import {
  relationTypes,
  metaRelationTypes,
  comboRelationTypes,
  getMenuOrder,
} from '../../Relations/config'

import score from '../../Score'
import { DraggableFlyOut } from '../FlyOut'
import RelationsGroup from './group'

// Assign form id looks like `free-field-something-form`
const freeFieldFormRegex = new RegExp(/^free-field-(\w+)-form$/)

class RelationsFlyOut extends DraggableFlyOut {
  constructor() {
    super('relations-menu')

    this.innerCtn = document.getElementById('relations-btns-ctn')
    this.deleteBtn = this.ctn.el.querySelector('.fly-out__deleteBtn')
    this.init()
  }

  get visibleGroups() {
    return [
      this.relations,
      this.metarelations,
      this.comborelations
    ].filter(({ isVisible }) => isVisible)
  }

  onTap(e) {
    super.onTap(e)

    // Delete relation
    if (e.target == this.deleteBtn) {
      return delete_relations()
    }

    const { dataset, classList } = e.target

    // Compact or expand
    const isCompactBtn = classList.contains('fly-out__compact')
    const isShowMoreBtn = classList.contains('fly-out__showMore')

    if (isCompactBtn || isShowMoreBtn) {
      this.compact(isCompactBtn)
      return this.computeValues()
    }

    if (!dataset?.hasOwnProperty('relationType')) { return }

    // Create relation
    if (classList.contains('btn--relation')) {
      this[dataset.relationType].eventCallbacks.tap(dataset.relationName)
    }
  }

  onSubmit(e) {
    const relationType = e.target.id.match(freeFieldFormRegex)?.[1]

    if (!relationType) { return }

    e.preventDefault()

    const { value } = this[relationType]?.freeField
    if (value) {
      this[relationType].eventCallbacks.tap(value)
    }
  }

  onScoreSelection() {
    const { hasSelection, selectionType, selectedRelationTypes } = score

    // Update selected buttons.
    this.relations.select(selectionType == 'relation' ? selectedRelationTypes : new Set())
    this.metarelations.select(selectionType == 'metarelation' ? selectedRelationTypes : new Set())

    // Hide if nothing is selected.
    this.toggleVisibility(hasSelection)

    this.reorder()

    // Always show the relations buttons.
    this.relations.show()

    // Show metarelations unless a note is selected.
    this.metarelations.toggleVisibility(selectionType != 'note')

    this.compact()

    // Disable the delete button unless a relation is selected.
    this.deleteBtn.disabled = !hasSelection || selectionType == 'note'

    /**
     * The dimensions of the fly-out may change if the selected item isn’t the
     * same type (note, relation, metarelation) as previously. On the first
     * selected item, we need to re-compute its values.
     */
    if (score.flatSelection.length == 1) {
      this.computeValues()
    }
  }

  /**
   * Reorder the relation groups depending on the type of the selection.
   * The order by type is defined in `modules/Relations/config.js`.
   */
  reorder() {

    // Reorder only when 1 item is selected.
    if (!(score.flatSelection.length === 1)) { return }

    const order = getMenuOrder(score.selectionType)

    for (let index = order.length - 1; index > 0; index--) {
      this.innerCtn.insertBefore(
        this[order[index - 1]].ctn,
        this[order[index]].ctn
      )
    }
  }

  compact(shouldCompact = null) {
    if (!(score.flatSelection.length)) { return }

    if (shouldCompact != null) {
      this.ctn.el.classList.toggle('fly-out--relations-compact', shouldCompact)
      this.ctn.el.classList.toggle('fly-out--big', !shouldCompact)
    }

    // Condition partly from src/js/app.js: do_comborelation()
    const comborelationsVisible =
        score.selectionType == 'note'
        && score.flatSelection.length > 2
        && score.selection.extraselected.length < 3
    this.comborelations.toggleVisibility(comborelationsVisible)
  }

  init() {
    this.relations = new RelationsGroup('relations', relationTypes, {
      tap: do_relation,
    })

    this.metarelations = new RelationsGroup('metarelations', metaRelationTypes, {
      tap: do_metarelation,
    })

    this.comborelations = new RelationsGroup('comborelations', comboRelationTypes, {
      tap: do_comborelation,
    })

    this.title = this.ctn.el.querySelector('.fly-out__title')
  }
}

const relationsMenu = new RelationsFlyOut()

export default relationsMenu
