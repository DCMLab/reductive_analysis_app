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

  /**
   * Handle auto-scrolling during resize when mouse is near viewport edges
   * @param {number} clientY - Current mouse Y position
   */
  function handleAutoScroll(clientY) {

    let clientY =

    // Clear any existing scroll interval
    if (state.scrollInterval) {
      clearInterval(state.scrollInterval)
      state.scrollInterval = null
    }

    const viewportHeight = window.innerHeight
    const distanceFromBottom = viewportHeight - clientY

    let views = document.getElementsByClassName('view')
    for (let view of views) {
      view.style.overflowY = "scroll"
    }

    const scrollSpeed =
      Math.ceil((state.scrollThreshold - distanceFromBottom) / 5)
    state.scrollInterval = setInterval(() => {
      window.scrollBy(0, scrollSpeed)

      // Update layer height based on the new scroll position
      const newHeight =
        state
          .currentLayer
          .getBoundingClientRect()
          .height + scrollSpeed

      state.currentLayer.style.height = `${newHeight}px`

      // Update related components
      if (layersMenu && typeof layersMenu.observe === 'function') {
        layersMenu.observe()
      }
    }, 16) // ~60fps

    for (let view of views) {
      view.style.overflowY = "hidden"
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
