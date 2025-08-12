/**
 * Layer resize handler
 *
 * This file contains functions to enable resizing of layers by sliding
 * the appropriate range slider
 */

const STATE = {
  minHeight: 100, // Minimum layer height in pixels
  scrollInterval: null, // For auto-scrolling
  scrollSpeed: 10, // Pixels per scroll adjustment
  scrollThreshold: 50 // Distance from viewport edge to trigger scrolling
}

// This is based on the height assigned for the layer class in CSS,
// would be best to have a way to sync the values
const HEIGHT_PX_DEFAULT =
  document.documentElement.clientHeight * 35 / 100
const SLIDER_DEFAULT = 130

class LayerResizer {
  constructor() {
    this.resizeSlider = document.getElementById('resize-slider')
    this.resizeSlider.value = SLIDER_DEFAULT

    this.currentHeight = HEIGHT_PX_DEFAULT

    // Resize on input from resize slider
    this.resizeSlider.oninput = () => this.sliderResize()
  }

  resetSlider() {
    this.currentHeight = HEIGHT_PX_DEFAULT
    this.resizeSlider.value = SLIDER_DEFAULT
  }

  /**
   * Updates the height of all layers
   */
  updateHeight() {
    // TODO: Should handle autoscroll

    let layers = document.getElementsByClassName('layer')

    for (let layer of layers) {
      layer.style.height = `${this.currentHeight}px`
    }

    if (this.currentHeight <= STATE.minHeight) {
      this.currentHeight = STATE.minHeight
      for (let layer of layers) {
        layer.style.height = `${this.currentHeight}px`
      }
    }
  }

  /**
   * Computes new layer size and updates
   */
  sliderResize() {

    this.currentHeight =
      HEIGHT_PX_DEFAULT * this.resizeSlider.value / 100
    this.updateHeight()

  }
}

const layerResizer = new LayerResizer()

export default layerResizer
