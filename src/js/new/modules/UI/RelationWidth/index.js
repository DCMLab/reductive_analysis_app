import { handle_hull_controller } from '../../../../ui'
import Progress from './progress'

class RelationWidth {
  constructor() {
    this.input = document.getElementById('relation-width')

    const { min, max, value } = this.input
    this.progressBar = new Progress('relation-width', { min, max, value })

    this.throttling = false
  }

  onInput({ target }) {
    if (target != this.input || this.throttling) {
      return
    }

    this.throttling = true

    requestAnimationFrame(() => {
      const value = parseInt(target.value)
      this.progressBar.update(value)
      handle_hull_controller(value)
      this.throttling = false
    })
  }
}

const relationWidth = new RelationWidth()

export default relationWidth
