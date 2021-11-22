import {
  do_relation,
  do_metarelation,
  do_comborelation,
} from '../../../../app'

import {
  relationTypes,
  metaRelationTypes,
  comboRelationTypes,
  menuOrderByType,
  getMenuOrder,
} from '../../Relations/config'

import score from '../../Score'
import { DraggableFlyOut } from '../FlyOut'
import RelationsGroup from './group'

class RelationsFlyOut extends DraggableFlyOut {
  constructor() {
    super('relations-menu')

    this.innerCtn = this.ctn.el.querySelector('.fly-out__innerSomething')
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

    const { dataset, classList } = e.target

    if (!('relationType' in dataset)) { return }

    const relationType = dataset.relationType

    // Create relation
    if (classList.contains('btn--relation')) {
      return this[relationType].eventCallbacks.tap(dataset.relationName)
    }

    // Toggle button
    if (classList.contains('btn')) {
      this[relationType].onTap()
      this.compact()
      this.computeValues()
    }
  }

  onBlur({ target: { dataset, value, id }, target }) {

    /**
     * Early return.
     *
     * We can’t directly check `!('relationType' in dataset)` because it
     * crashes on `document` blur (it has no `dataset`). Two options:
     * 1. if (!dataset || !('relationType' in dataset))
     * 2. if (!dataset?.hasOwnProperty('relationType'))
     *
     * `hasOwnProperty` is preferred: it allows optional chaining.
     */
    if (!dataset?.hasOwnProperty('relationType')) { return }

    const { relationType } = dataset

    if (value && id == `free-field-${relationType}`) {
      return this[relationType].eventCallbacks.tap(value)
    }
  }

  onScoreSelection({ detail }) {

    // Nothing selected: hide the menu. Otherwise: show it.
    this.toggleVisibility(score.flatSelection.length)

    this.reorder()

    // Always show the relations buttons.
    this.relations.show()

    // Only hide metarelations when a note is selected.
    this.metarelations.toggleVisibility(score.selectionType != 'note')

    // // selected items are relations or metarelations
    // if (/relation/.test(score.selectionType)) {
    //   this[score.selectionType + 's'].show()
    // }

    this.compact()

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

      // Expand all but first one.
      if (index > 1) {
        this[order[index - 1]].toggle(true)
      }
    }
  }

  compact() {
    // Reorder only when 1 item is selected.
    if (!(score.flatSelection.length === 1)) { return }

    const order = getMenuOrder(score.selectionType)
    const shouldCompact = !this[order[0]].isExpanded
    this.ctn.el.classList.toggle('fly-out--relations-compact', shouldCompact)
    this.ctn.el.classList.toggle('fly-out--big', !shouldCompact)

    // Condition partly from src/js/app.js: do_comborelation()
    const comborelationsVisible =
        this.relations.isExpanded
        && score.selectionType == 'note'
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
