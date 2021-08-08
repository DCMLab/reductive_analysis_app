/**
 * @todo:
 * - Split in two parts.
 *
 * 1) open/close management
 *
 * 2) handle filter block that will be instantiated two times (one for
 * relations, one for metarelations) instead of these managing both…
 *
 * 3) bring default color config
 */

class Filters {
  constructor() {
    this.open = false

    // Filters DOM elements
    this.ctn = document.getElementById('filters')
    this.toggleBtn = document.getElementById('filters-toggle')
    this.relationsCtn = document.getElementById('relations-filters')
    this.metaRelationsCtn = document.getElementById('meta-relations-filters')
    this.relations = []
    this.metaRelations = []

    // Score DOM elements
    this.svgCtn = document.getElementById('layers')
    this.relationsPaths = this.svgCtn.getElementsByClassName('relation')
    this.metaRelationsPaths = this.svgCtn.getElementsByClassName('metarelation')

    this.observer = this.createObserver()
  }

  onTap({ target }) {
    if (target == this.toggleBtn) {
      this.toggle()
    }
  }

  onChange(e) {
    if (e.composedPath().includes(this.relationsCtn)) {
      this.toggleRelationsFromType(e.target.dataset.type, e.target.checked)
    }
    if (e.composedPath().includes(this.metaRelationsCtn)) {
      this.toggleMetaRelationsFromType(e.target.dataset.type, e.target.checked)
    }
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

      if (newRelation) {
        const relationType = newRelation.getAttribute('type')
        const isNewType =
          !this.relations.some(relation => relation.type == relationType)
          && !this.metaRelations.some(relation => relation.type == relationType)

        if (isNewType) {
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
    this.getRelations()
    this.getMetaRelations()
    this.render()
  }

  /**
   * Get the list of relations on the page.
   */
  getRelations() {
    const uniqueRelations = new Set(Array.from(this.relationsPaths, path => path.getAttribute('type')))

    this.relations = Array.from(uniqueRelations, type => ({
      type,
      checked: true, // @todo: modify later
      el: null, // @todo: useless for now…
    }))
  }

  getMetaRelations() {
    const uniqueRelations = new Set(Array.from(this.metaRelationsPaths, path => path.getAttribute('type')))

    this.metaRelations = Array.from(uniqueRelations, type => ({
      type,
      checked: true, // @todo: modify later
      el: null, // @todo: useless for now…
    }))
  }

  /**
   * Show/hide relations from specified type
   */

  toggleRelationsFromType(type, state) {
    this.toggleAllFromType(this.relationsPaths, type, state)
  }

  toggleMetaRelationsFromType(type, state) {
    this.toggleAllFromType(this.metaRelationsPaths, type, state)
  }

  toggleAllFromType(paths, type, state) {
    Array.from(paths)
      .filter(path => path.getAttribute('type') == type)
      .forEach(path => path.classList.toggle('filtered', !state))
  }

  render() {
    let filtersDomString = this.relations.map(relation => this.createFilterElement(relation, 'relation')).join(' ')
    this.relationsCtn.innerHTML = filtersDomString

    filtersDomString = this.metaRelations.map(relation => this.createFilterElement(relation, 'metarelation')).join(' ')
    this.metaRelationsCtn.innerHTML = filtersDomString
  }

  createFilterElement({ type, checked }, relationCategory) {
    return `
      <li>
        <label class="checkable color-${relationCategory}-${type}" for="${relationCategory}-filter-${type}">
            ${type}
            <input class="checkable__input" type="checkbox" id="${relationCategory}-filter-${type}" data-type="${type}" ${checked ? 'checked' : ''}>
            <span class="checkbox checkbox--colored">
                <svg class="checkable__icon btn__icon" width="12" height="10">
                    <use xlink:href="#check-path"/>
                </svg>
            </span>
        </label>
      </li>
    `
  }
}

const filters = new Filters()

export default filters
