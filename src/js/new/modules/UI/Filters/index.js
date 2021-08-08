/**
 * Filter relations shown on screen. The filters available are the ones
 * matching the score relations and are automatically synced using a
 * MutationObserver listening for DOM changes in score.
 *
 * @todo:
 *
 * 1) update on metarelations delete
 *
 * 2) reset state on new score upload
 *
 * 3) bring default color config
 *
 * 4) remove filters from index.html as they are JS-generated
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

    // Filters groups
    this.groups = [
      new Group('relation', {
        filterCtnId: 'relations-filters', svgCtn: this.svgCtn
      }),
      new Group('metarelation', {
        filterCtnId: 'meta-relations-filters', svgCtn: this.svgCtn }),
    ]
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

      console.log(newRelation)

      if (newRelation) {
        const relationType = newRelation.getAttribute('type')
        const isExistingType = this.groups.some(group => group.hasRelationType(relationType))
        console.log(isExistingType)
        if (!isExistingType) {
          return this.update()
        }
      }
    })
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
