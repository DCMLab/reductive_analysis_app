import {
  handle_curvature_controller,
  adjustAllLayersSvgDimensions
} from '../utils/misc'
import Progress from './progress'

class RelationCurvature {
  constructor() {
    this.input = document.getElementById('relation-width')

    const { min, max, value } = this.input
    this.progressBar = new Progress('relation-width', { min, max, value })
  }

  onInput({ target }) {
    if (target != this.input) {
      return
    }
    const value = target.value
    this.progressBar.update(value)
  }

  onTapEnd({ target }) {
    if (target != this.input) {
      return
    }

    const value = target.value
    this.progressBar.update(value)
    handle_curvature_controller(value)
    adjustAllLayersSvgDimensions()
  }
}

const relationCurvature = new RelationCurvature()

export default relationCurvature
