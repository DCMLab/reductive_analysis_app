import { CacheMap } from '../../utils/cache'

const SELECTABLE_TYPES = ['note', 'relation', 'metarelation']

class Score {

  #selection

  /**
   * A private cache for getters requiring a bit of computation: the cached
   * results is returned unless the selection has changed.
   */
  #cache = new CacheMap()

  constructor() {
    this.loaded = false
    this.mei = null
  }

  // `selection` uses a getter in order to flush the cache on selection change.

  get selection() {
    return this.#selection
  }

  set selection(value) {
    this.#cache.clear()
    this.#selection = value
  }

  // Cached members.

  get flatSelection() {
    return this.#cache.remember('flatSelection', () => Object.values(this.selection).flat())
  }

  get hasSelection() {
    return this.#cache.remember('hasSelection', () => this.flatSelection.length > 0)
  }

  get selectionType() {
    return this.#cache.remember('selectionType', () => {
      return SELECTABLE_TYPES.find(type => {
        return this.flatSelection[0]?.classList.contains(type)
      }) ?? null
    })
  }

  get relationTypes() {
    return this.#cache.remember('relationTypes', () => {
      if (!this.hasSelection || this.selectionType == 'note') { return null }

      return new Set(this.flatSelection.map(el => el.getAttribute('type')).filter(type => type))
    })
  }

  // Events.

  onScoreLoad() {
    this.loaded = true
    this.mei = window.mei
    this.#cache.clear()
  }

  onScoreSelection({ detail }) {
    this.selection = detail
  }
}

const score = new Score()

export default score
