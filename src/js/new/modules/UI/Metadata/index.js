class Metadata {
  constructor() {
    this.visible = false

    // Filters DOM elements
    this.ctn = document.getElementById('metadata')
    this.toggleBtn = document.getElementById('metadata-toggle')
  }

  onTap({ target }) {
    if (target == this.toggleBtn) {
      this.toggle()
    }
  }

  onScoreLoad() {
    this.findInScore()
  }

  toggle(state = !this.visible) {
    this.visible = state
    this.ctn.classList.toggle('fly-out--expanded', state)
    this.ctn.classList.toggle('fly-out--collapsed', !state)
  }

  findInScore() {
  }
}

const metadata = new Metadata()

export default metadata
