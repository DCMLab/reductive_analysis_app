class Score {
  constructor() {
    this.loaded = false
    this.mei = null
    this.selection = null
  }

  get flatSelection() {
    return Object.values(score.selection).flat()
  }

  onScoreLoad() {
    this.loaded = true
    this.mei = window.mei
  }

  onScoreSelection({ detail }) {
    this.selection = detail
    /**
     * @todo: here, update the block showing the primary/secondary selections.
     */
  }
}

const score = new Score()

export default score
