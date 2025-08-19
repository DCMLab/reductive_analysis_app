/**
 * Layer resize handler
 *
 * This file contains functions to enable resizing of layers
 */

import { getDrawContexts } from '../../../bootstrap'

const STATE = {
  minHeight: 100, // Minimum layer height in pixels
}

// This is based on the height assigned for the layer class in CSS,
// would be best to have a way to sync the values
const HEIGHT_PX_DEFAULT =
  document.documentElement.clientHeight * 35 / 100

class LayerResizer {
  constructor() {
    this.currentHeight = HEIGHT_PX_DEFAULT
    this.prevHeight = this.currentHeight

    this.incHeightBtn = document.getElementById('inc-size')
    this.decHeightBtn = document.getElementById('dec-size')

    this.incHeightBtn.onclick = () => this.computeSizeAndUpdate(100)
    this.decHeightBtn.onclick = () => this.computeSizeAndUpdate(-100)
  }

  /**
   * Auto-scrolls according to the new height so that the score
   * is at the y-centre of the layer
   */
  autoScroll() {

    // Compute scroll value
    let scroll = (this.prevHeight - this.currentHeight) / 2

    let views = document.getElementsByClassName('view')
    for (let view of views) {
      view.scrollBy({
        top: scroll,
      })
    }

  }

  /**
   * Updates the height of all layers
   */
  updateHeight() {

    let contexts = getDrawContexts()

    for (let c of contexts) {
      c.layer.layer_elem.style.height = `${this.currentHeight * c.zoom}px`
    }

    if (this.currentHeight <= STATE.minHeight) {
      for (let c of contexts) {
        c.layer.layer_elem.style.height = `${STATE.minHeight}px`
      }
    }

  }

  /**
   * Computes new layer size and updates
   */
  computeSizeAndUpdate(step) {

    let maxHeight =
      document
        .getElementsByClassName('svg_container')[0]
        .getElementsByTagName('svg')[0]
        .getAttribute('height')
    maxHeight = maxHeight.slice(0, -2)

    this.prevHeight = this.currentHeight
    this.currentHeight += step

    this.updateHeight()
    this.autoScroll()

  }
}

const layerResizer = new LayerResizer()

export default layerResizer
