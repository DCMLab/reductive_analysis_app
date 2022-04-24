import { getRelationType, isMetaRelationCircle, isRelation } from '../UI/Selection/helpers'

/**
 * This class is only responsible to set the tooltip label when the mouse foes
 * over an element (a note or a relation). The visibility is controled with
 * CSS, using the `:has` pseudo-selector (in /sass/score/_tooltip.scss).
 */
class ScoreTooltip {
  constructor() {
    this.content = document.getElementById('score-tooltip')
  }

  setContent(relationType) {
    this.content.innerHTML = relationType
  }

  onMouseEnter({ target }) {
    const hasEnteredRelation = isRelation(target)
    const hasEnteredMetaRelation = isMetaRelationCircle(target)

    if (!hasEnteredRelation && !hasEnteredMetaRelation) { return }

    const relationType = getRelationType(target) ?? getRelationType(target.parentElement)
    this.setContent(relationType)
  }
}

const tooltip = new ScoreTooltip()

export default tooltip
