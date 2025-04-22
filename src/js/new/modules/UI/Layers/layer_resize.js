/**
 * Layer resize handler
 *
 * This file contains functions to enable resizing of layers by dragging their bottom border
 */

/**
 * Initialize the layer resize functionality
 * @param {Object} layersMenu - The layers menu controller
 */
export function initLayerResize(layersMenu) {
  // Store state for resize operation
  const state = {
    resizing: false,
    currentLayer: null,
    startY: 0,
    startHeight: 0,
    minHeight: 100, // Minimum layer height in pixels
    scrollInterval: null, // For auto-scrolling
    scrollSpeed: 10, // Pixels per scroll adjustment
    scrollThreshold: 50 // Distance from viewport edge to trigger scrolling
  }

  /**
   * Start the resize operation when mouse is pressed on the layer bottom border
   * @param {MouseEvent} e - The mouse event
   */
  function startResize(e) {
    // Check if the click is within the bottom 6px of the layer (the resize handle area)
    const rect = e.currentTarget.getBoundingClientRect()
    const bottomArea = rect.bottom - 6

    if (e.clientY >= bottomArea) {
      startResizeForLayer(e.currentTarget, e)
    }
  }

  /**
   * Start resize operation for a specific layer element
   * @param {HTMLElement} layerElement - The layer element to resize
   * @param {MouseEvent} e - The mouse event
   */
  function startResizeForLayer(layerElement, e) {
    if (!layerElement) return

    state.resizing = true
    state.currentLayer = layerElement
    state.startY = e.clientY
    state.startHeight = layerElement.getBoundingClientRect().height

    // Add resizing class to current layer
    state.currentLayer.classList.add('layer--resizing')

    // Prevent text selection during resize
    document.body.style.userSelect = 'none'

    // Add event listeners for resize operations
    document.addEventListener('mousemove', onResize)
    document.addEventListener('mouseup', stopResize)

    // Prevent default behavior
    e.preventDefault()
  }

  /**
   * Handle auto-scrolling during resize when mouse is near viewport edges
   * @param {number} clientY - Current mouse Y position
   */
  function handleAutoScroll(clientY) {
    // Clear any existing scroll interval
    if (state.scrollInterval) {
      clearInterval(state.scrollInterval)
      state.scrollInterval = null
    }

    const viewportHeight = window.innerHeight
    const distanceFromBottom = viewportHeight - clientY

    // If cursor is near the bottom of the viewport, auto-scroll down
    if (distanceFromBottom < state.scrollThreshold) {
      const scrollSpeed = Math.ceil((state.scrollThreshold - distanceFromBottom) / 5)
      state.scrollInterval = setInterval(() => {
        window.scrollBy(0, scrollSpeed)

        // Update layer height based on the new scroll position
        if (state.currentLayer && state.resizing) {
          const newHeight = state.currentLayer.getBoundingClientRect().height + scrollSpeed
          state.currentLayer.style.height = `${newHeight}px`

          // Update related components
          if (layersMenu && typeof layersMenu.observe === 'function') {
            layersMenu.observe()
          }
        }
      }, 16) // ~60fps
    }
  }

  /**
   * Update layer height during resize
   * @param {MouseEvent} e - The mouse event
   */
  function onResize(e) {
    if (!state.resizing) return

    // Handle auto-scrolling
    handleAutoScroll(e.clientY)

    // Calculate new height
    const deltaY = e.clientY - state.startY
    let newHeight = Math.max(state.startHeight + deltaY, state.minHeight)

    // Apply new height to the layer
    state.currentLayer.style.height = `${newHeight}px`

    // Force minimum height constraint
    if (newHeight <= state.minHeight) {
      state.currentLayer.style.height = `${state.minHeight}px`
    }

    // Update any related components if needed
    if (layersMenu && typeof layersMenu.observe === 'function') {
      layersMenu.observe()
    }
  }

  /**
   * End the resize operation
   */
  function stopResize() {
    if (state.currentLayer) {
      // Remove resizing class
      state.currentLayer.classList.remove('layer--resizing')

      // Restore text selection
      document.body.style.userSelect = ''

      // Clear state
      state.resizing = false
      state.currentLayer = null
    }

    // Stop auto-scrolling if active
    if (state.scrollInterval) {
      clearInterval(state.scrollInterval)
      state.scrollInterval = null
    }

    // Remove event listeners
    document.removeEventListener('mousemove', onResize)
    document.removeEventListener('mouseup', stopResize)
  }

  /**
   * Attach resize handlers to all layers
   */
  function attachResizeHandlers() {
    // Get all layer elements
    const layers = document.querySelectorAll('.layer')

    // Add mousedown event listener to each layer
    layers.forEach(layer => {
      // Only add the event listener if it hasn't been added before
      if (!layer._hasResizeHandler) {
        layer.addEventListener('mousedown', startResize)
        layer._hasResizeHandler = true
      }
    })
  }

  /**
   * Attach resize handler to a specific layer element
   * @param {HTMLElement} layerElement - The layer element to attach handler to
   */
  function attachHandlerToLayer(layerElement) {
    if (layerElement && !layerElement._hasResizeHandler) {
      layerElement.addEventListener('mousedown', startResize)
      layerElement._hasResizeHandler = true
    }
  }

  /**
   * Update resize handlers when new layers are added
   */
  function updateResizeHandlers() {
    // Get all layer elements and attach handlers to them
    attachResizeHandlers()
  }

  // Set up a MutationObserver to watch for new layers
  const layersContainer = document.getElementById('layers')
  if (layersContainer) {
    const observer = new MutationObserver((mutations) => {
      // If nodes were added, check if any of them are layers or contain layers
      let shouldAttachHandlers = false

      mutations.forEach(mutation => {
        if (mutation.addedNodes.length > 0) {
          // Check if any added node is a layer or contains layers
          mutation.addedNodes.forEach(node => {
            if (node.classList && node.classList.contains('layer')) {
              shouldAttachHandlers = true
            } else if (node.querySelectorAll) {
              const layers = node.querySelectorAll('.layer')
              if (layers.length > 0) {
                shouldAttachHandlers = true
              }
            }
          })
        }
      })

      if (shouldAttachHandlers) {
        // Wait a brief moment for the DOM to settle
        setTimeout(attachResizeHandlers, 0)
      }
    })

    // Start observing the container with the configured parameters
    observer.observe(layersContainer, { childList: true, subtree: true })
  }

  // Listen for the scoreload event which is dispatched when a score is loaded
  document.addEventListener('scoreload', () => {
    // Wait a moment for the DOM to be updated with the new layers
    setTimeout(attachResizeHandlers, 100)
  })

  // Initial setup
  attachResizeHandlers()

  // Return functions that might be needed by the layersMenu controller
  return {
    attachResizeHandlers,
    updateResizeHandlers,
    attachHandlerToLayer,
    startResizeForLayer
  }
}
