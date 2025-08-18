/**
 * Layer resize handler
 *
 * This file contains functions to enable resizing of layers by sliding
 * the appropriate range slider
 */

import { getDrawContexts } from '../../../bootstrap'

const STATE = {
  minHeight: 100, // Minimum layer height in pixels
}

// This is based on the height assigned for the layer class in CSS,
// would be best to have a way to sync the values
const HEIGHT_PX_DEFAULT =
  document.documentElement.clientHeight * 35 / 100
const SLIDER_DEFAULT = 50

class LayerResizer {
  constructor() {
    this.resizeSlider = document.getElementById('resize-slider')
    this.resizeSlider.value = SLIDER_DEFAULT

    this.currentHeight = HEIGHT_PX_DEFAULT
    this.prevHeight = this.currentHeight

    // Resize on input from resize slider
    this.resizeSlider.oninput = () => this.sliderResize()
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

  resetSlider() {
    this.currentHeight = HEIGHT_PX_DEFAULT
    this.resizeSlider.value = SLIDER_DEFAULT
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
  sliderResize() {

    let maxHeight =
      document
        .getElementsByClassName('svg_container')[0]
        .getElementsByTagName('svg')[0]
        .getAttribute('height')
    maxHeight = maxHeight.slice(0, -2)

    this.prevHeight = this.currentHeight
    this.currentHeight =
      maxHeight * this.resizeSlider.value / 100

    this.updateHeight()
    this.autoScroll()

  }
}

const layerResizer = new LayerResizer()

export default layerResizer
