import { createBtn, createDatalist, createFillable, createShowMoreBtn } from './templates'

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

  initHtml(config) {

    // buttons with main relations
    const btnsHtml = Object.keys(config.main)
      .map(name => createBtn(name, this.type))
      .join('')

    let additionalContent = ''

    // button to toggle visibility of more relation buttons
    if (config.main.length > 3 || 'additional' in config) {
      additionalContent += createShowMoreBtn(this.type)
    }

    if ('additional' in config) {
      additionalContent +=

      // separator between group items (not ideal)
      '<hr class="fly-out__hr">'

        // free field with autocomplete proposals for even more relations…
        // @Todo: handle this input change events from somewhere…
        + createFillable(this.type, { label: 'Select a ' + this.name })
        + createDatalist(config.additional, this.type)

      // separator before next group (not ideal)
      '<hr class="fly-out__hr">'
    }

    this.ctn = document.getElementById(`${this.type}-btns`)
    this.ctn.innerHTML = btnsHtml + additionalContent

    this.btns = this.ctn.getElementsByClassName('btn--relation')
    this.freeField = this.ctn.querySelector(`#free-field-${this.type}`)
  }
}
