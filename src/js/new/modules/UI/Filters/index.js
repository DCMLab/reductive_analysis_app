/**
 * Filter relations shown on screen. The filters available are the ones
 * matching the score relations and are automatically synced using a
 * MutationObserver listening to DOM changes in the current score.
 *
 * @todo:
 * 1) bring default color config
 * 2) remove filters from index.html as they are JS-generated
 */

import { NodeType } from '../../../utils/dom'
import Group from './group'

class Filters {
  constructor() {
    this.visible = false

    // Filters DOM elements
    this.ctn = document.getElementById('filters')
    this.toggleBtn = document.getElementById('filters-toggle')

    // Score SVG container
    this.svgCtn = document.getElementById('layers')

    this.observer = this.createMutationObserver() // adapt it
    this.groups = this.createFiltersGroups()
  }

  onTap({ target }) {
    if (target == this.toggleBtn) {
      this.toggle()
    }
  }

  onChange(e) {
    this.groups.forEach(group => group.onChange(e))
  }

  onScoreLoad() {
    this.toggle(false) // close filter menu
    this.observer.disconnect() // stop observer
    this.update()
    this.observe() // restart observer
  }

  observe() {
    this.observer.observe(document.querySelector('#layers .svg_container > svg .page-margin'), {
      subtree: true,
      childList: true,
      attributeOldValue: true,
      attributeFilter: ['type'],
    })
  }

  toggle(state = !this.visible) {
    this.visible = state
    this.ctn.classList.toggle('fly-out--expanded', state)
    this.ctn.classList.toggle('fly-out--collapsed', !state)
  }

  update() {
    this.groups.forEach(group => group.getRelations())
    this.groups.forEach(group => group.render())
  }

  createFiltersGroups = () => [
    new Group('relation', {
      filterCtnId: 'relations-filters',
      svgCtn: this.svgCtn,
    }),
    new Group('metarelation', {
      filterCtnId: 'meta-relations-filters',
      svgCtn: this.svgCtn,
    }),
  ]

  createMutationObserver = () => new MutationObserver(mutations => {

    // Look for a type change in a relation.

    const changesInListOfRelationsNames = mutations
      .filter(mutation => mutation.type == 'attributes' && mutation.attributeName == 'type')
      .filter(mutation => mutation.target.getAttribute('type') != mutation.oldValue)
      .length > 0

    if (changesInListOfRelationsNames) {
      return this.update()
    }

    // Is there a new relation type in the SVG?

    const newRelation = mutations.length == 1 && mutations
      .filter(mutation => mutation.type == 'childList' && mutation.addedNodes?.length == 1)
      .map(mutation => mutation.addedNodes?.item(0))
      .find(NodeType.isElement)

    if (newRelation) {
      const relationType = newRelation.getAttribute('type')
      const isExistingType = this.groups.some(group => group.hasRelationType(relationType))
      if (!isExistingType) {
        return this.update()
      }
    }

    // Deleted relation.

    const deletedRelation = mutations.length == 1 && mutations
      .filter(mutation => mutation.type == 'childList' && mutation.removedNodes?.length == 1)
      .map(mutation => mutation.removedNodes?.item(0))
      .find(NodeType.isElement)

    if (deletedRelation) {
      const relationType = deletedRelation.getAttribute('type')
      const wasLastOfType = this.groups.some(group => group.wasLastOfType(relationType))
      if (wasLastOfType) {
        return this.update()
      }
    }
  })
}

const filters = new Filters()

export default filters
