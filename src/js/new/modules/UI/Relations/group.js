import {
  createBtn,
  createDatalist,
  createFillable,
  createShowMoreBtn,
  createTitle
} from './templates'

export default class RelationsGroup {
  #visible = false

  constructor(type, config, eventCallbacks = {}) {
    this.type = type
    this.name = config.name
    this.eventCallbacks = eventCallbacks

    this.initHtml(config)
  }

  get isVisible() { return this.#visible }

  show() { this.toggleVisibility(true) }
  hide() { this.toggleVisibility(false) }

  toggleVisibility(state = !this.#visible) {
    this.#visible = state
    this.ctn.classList.toggle('fly-out__relationsBtnsCtn--visible', state)
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
    const titleHtml = createTitle(config.name)

    // buttons with main relations
    let btnsHtml = Object.keys(config.main)
      .map((name, index) => createBtn(name, this.type, index))
      .join('')

    // button to toggle visibility of more relation buttons
    if (config.main.length > 3 || 'additional' in config) {
      btnsHtml += createShowMoreBtn(this.type)
    }

    btnsHtml = `<div class="btn-group">${btnsHtml}</div>`

    let additionalRelations = ''
    if ('additional' in config) {
      additionalRelations +=

        // free field with autocomplete proposals for even more relations…
        // @Todo: handle this input change events from somewhere…
        createFillable(this.type, { label: 'Or type a ' + this.name })
        + createDatalist(config.additional, this.type)
    }

    this.ctn = document.getElementById(`${this.type}-btns`)
    this.ctn.innerHTML = titleHtml + btnsHtml + additionalRelations

    this.btns = this.ctn.getElementsByClassName('btn--relation')
    this.selectedBtns = this.ctn.getElementsByClassName('btn--selected')
    this.freeField = this.ctn.querySelector(`#free-field-${this.type}`)
  }
}
