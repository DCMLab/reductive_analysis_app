import { capitalize } from '../../../utils/string'

export default class FilterGroup {
  constructor(namespace, options) {
    this.namespace = namespace

    this.ctn = document.getElementById(options.filterCtnId)
    this.paths = options.svgCtn.getElementsByClassName(namespace)
    this.fields = []
  }

  onChange(e) {
    if (e.composedPath().includes(this.ctn)) {
      this.toggleRelationsPaths(e.target.dataset.type, e.target.checked)
    }
  }

  /**
   * Show/hide relations from specified type
   */
  toggleRelationsPaths(type, state) {
    Array.from(this.paths)
      .filter(path => path.getAttribute('type') == type)
      .forEach(path => path.classList.toggle('relation--filtered', !state))
  }

  /**
   * Get the list of relations on the page.
   */
  getRelations() {
    const uniqueRelations = new Set(Array.from(this.paths, path => path.getAttribute('type')))

    this.fields = Array.from(uniqueRelations, type => ({
      type,
      checked: true, // @todo: modify later
      el: null, // @todo: useless for now…
    }))
  }

  hasRelationType(relationType) {
    return this.fields.some(relation => relation.type == relationType)
  }

  wasLastOfType(relationType) {
    return !Array.from(this.paths).some(path => path.getAttribute('type') == relationType)
  }

  render() {
    let filtersDomString = this.fields.map(relationType => this.createFilterElement(relationType)).join(' ')
    this.ctn.innerHTML = filtersDomString
  }

  createFilterElement({ type, checked }) {
    return `
      <li>
        <label class="checkable color-${this.namespace}-${type}" for="${this.namespace}-filter-${type}">
            ${capitalize(type)}
            <input class="checkable__input" type="checkbox" id="${this.namespace}-filter-${type}" data-type="${type}" ${checked ? 'checked' : ''}>
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
