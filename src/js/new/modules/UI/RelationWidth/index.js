import { handle_curvature_controller } from '../../../../ui'
import Progress from './progress'

class RelationWidth {
  constructor() {
    this.input = document.getElementById('relation-width')

    const { min, max, value } = this.input
    this.progressBar = new Progress('relation-width', { min, max, value })
    console.log('initializing relation width controller with value ', this.input.value)

    this.throttling = false
  }

  onInput({ target }) {
    if (target != this.input || this.throttling) {
      return
    }

    this.throttling = true

    requestAnimationFrame(() => {
      const value = target.value
      this.progressBar.update(value)
      handle_curvature_controller(value)
      this.throttling = false
    })
  }
}

const relationWidth = new RelationWidth()

export default relationWidth
