import {
  createBtn,
  createDatalistFillable,
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

    // Mark buttons as selected
    const btns = Array.from(this.btns).filter(btn => types.has(btn.dataset.relationName))
    btns.forEach(btn => btn.classList.add('btn--selected'))

    if (types.size <= btns.length) { return }

    // Search for custom relations
    const btnsTypes = btns.map(btn => btn.dataset.relationName)
    const customTypes = [...types].filter(type => !btnsTypes.includes(type))

    // Mark the free field as selected
    this.freeFieldCtn.classList.add('fly-out__relationsField--selected')

    // If exactly 1 custom relation is selected, prefill the free field
    if (customTypes.length == 1) {
      this.freeField.value = customTypes[0]
    }
  }

  unselect() {

    // Unselect buttons
    Array.from(this.selectedBtns)
      .forEach(btn => btn.classList.remove('btn--selected'))

    // free field
    this.freeFieldCtn.classList.remove('fly-out__relationsField--selected')
    this.freeField.value = ''
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

    // free field with autocomplete proposals for even more relations…
    const additionalRelations = 'additional' in config
      ? createDatalistFillable(config, this.type)
      : ''

    let specifics = ''

    // Note bookmarks and naturalize ; shouldn’t be there
    if (config.name == 'relation') {
      specifics = `
        <hr class="fly-out__hr visible-when-selection-is-note">
        <div class="fly-out__noteActions btn-group visible-when-selection-is-note">
            <button
                class="fly-out__secondaryBtn | btn btn--hollow btn--small-icon"
                type="button"
                id="bookmark-note"
                aria-label="Bookmark note"
                title="Bookmark note"
            >
                <svg class="btn__icon" width="12" height="16">
                    <use href="#bookmark-path"/>
                </svg>
                <span class="hide-when-compact">Bookmark note</span>
            </button>
            <button
                class="fly-out__secondaryBtn | btn btn--hollow btn--small-icon hidden-when-in-layer-1 hidden-when-can-not-edit-layer"
                type="button"
                id="naturalize-note"
                aria-label="Naturalize note"
                title="Naturalize note"
            >
                <svg class="btn__icon" width="15" height="15">
                    <use href="#note-purple-bg-path"/>
                </svg>
                <span class="hide-when-compact">Naturalize note</span>
            </button>
        </div>
      `
    }

    this.ctn = document.getElementById(`${this.type}-btns`)
    this.ctn.innerHTML = titleHtml + btnsHtml + additionalRelations + specifics

    this.btns = this.ctn.getElementsByClassName('btn--relation')
    this.selectedBtns = this.ctn.getElementsByClassName('btn--selected')
    this.freeField = this.ctn.querySelector(`#free-field-${this.type}`)
    this.freeFieldCtn = this.freeField?.parentElement
  }
}
