import { createBtn, createDatalist, createFillable, createSeparator, createShowMoreBtn } from './templates'

export default class RelationsGroup {
  #visible = false
  #expanded = false

  constructor(type, config, eventCallbacks = {}) {
    this.type = type
    this.name = config.name
    this.eventCallbacks = eventCallbacks

    this.initHtml(config)
  }

  get isVisible() { return this.#visible }
  get isExpanded() { return this.#expanded }

  onTap() { this.toggle() }

  show() { this.toggleVisibility(true) }
  hide() { this.toggleVisibility(false) }

  expand() { this.toggle(true) }
  collapse() { this.toggle(false) }

  toggleVisibility(state = !this.#visible) {
    this.#visible = state
    this.ctn.classList.toggle('fly-out__btnGroup--visible', state)
  }

  toggle(state = !this.#expanded) {
    this.#expanded = state
    this.ctn.classList.toggle('fly-out__btnGroup--expanded', state)
  }

  select(types) {
    this.unselect()

    if (!types) { return }

    Array.from(this.btns)
      .filter(btn => types.has(btn.dataset.relationName))
      .forEach(btn => btn.classList.add('btn--selected'))
  }

  unselect() {
    Array.from(this.selectedBtns)
      .forEach(btn => btn.classList.remove('btn--selected'))
  }

  initHtml(config) {

    // buttons with main relations
    const btnsHtml = Object.keys(config.main)
      .map((name, index) => createBtn(name, this.type, index))
      .join('')

    let additionalContent = ''

    // button to toggle visibility of more relation buttons
    if (config.main.length > 3 || 'additional' in config) {
      additionalContent += createShowMoreBtn(this.type)
    }

    if ('additional' in config) {
      additionalContent +=

        // separator between group items (not ideal)
        createSeparator()

        // free field with autocomplete proposals for even more relations…
        // @Todo: handle this input change events from somewhere…
        + createFillable(this.type, { label: 'Select a ' + this.name })
        + createDatalist(config.additional, this.type)
    }

    this.ctn = document.getElementById(`${this.type}-btns`)
    this.ctn.innerHTML = btnsHtml + additionalContent

    this.btns = this.ctn.getElementsByClassName('btn--relation')
    this.selectedBtns = this.ctn.getElementsByClassName('btn--selected')
    this.freeField = this.ctn.querySelector(`#free-field-${this.type}`)
  }
}
