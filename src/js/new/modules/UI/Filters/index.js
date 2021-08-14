/**
 * Filter relations shown on screen. The filters available are the ones
 * matching the score relations and are automatically synced using a
 * MutationObserver listening for DOM changes in score.
 *
 * @todo:
 *
 * 1) bring default color config
 *
 * 2) remove filters from index.html as they are JS-generated
 */

import Group from './group'

class Filters {
  constructor() {
    this.open = false

    // Filters DOM elements
    this.ctn = document.getElementById('filters')
    this.toggleBtn = document.getElementById('filters-toggle')

    // Score SVG
    this.svgCtn = document.getElementById('layers')

    this.observer = this.createObserver() // adapt it
    this.groups = this.createGroups()
  }

  onTap({ target }) {
    if (target == this.toggleBtn) {
      this.toggle()
    }
  }

  onChange(e) {
    this.groups.forEach(group => group.onChange(e))
  }

  onScoreLoad(e) {
    this.toggle(false) // close filter menu
    this.observer.disconnect() // stop observer
    this.update()
    this.observe() // restart observer
  }

  createObserver() {
    return new MutationObserver(mutations => {

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
        .find(node => node.nodeType == 1)

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
        .find(node => node.nodeType == 1)

      if (deletedRelation) {
        const relationType = deletedRelation.getAttribute('type')
        const wasLastOfType = this.groups.some(group => group.wasLastOfType(relationType))
        if (wasLastOfType) {
          return this.update()
        }
      }
    })
  }

  // Filters groups
  createGroups() {
    return [
      new Group('relation', {
        filterCtnId: 'relations-filters',
        svgCtn: this.svgCtn,
      }),
      new Group('metarelation', {
        filterCtnId: 'meta-relations-filters',
        svgCtn: this.svgCtn,
      }),
    ]
  }

  observe() {
    this.observer.observe(document.querySelector('#layers .svg_container > svg .page-margin'), {
      subtree: true,
      childList: true,
      attributeOldValue: true,
      attributeFilter: ['type'],
    })
  }

  toggle(state = !this.open) {
    this.open = state
    this.ctn.classList.toggle('fly-out--expanded', state)
    this.ctn.classList.toggle('fly-out--collapsed', !state)
  }

  update() {
    this.groups.forEach(group => group.getRelations())
    this.groups.forEach(group => group.render())
  }
}

const filters = new Filters()

export default filters
