/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/

import $ from 'jquery'
import { getDrawContexts } from './app'

// Space drag implementation
let isDragging = false
let dragStartX = 0
let dragStartY = 0
let currentContext = null
let initialTransform = null

export function setupSpaceDrag() {
  const drawContexts = getDrawContexts()
  if (!drawContexts || !drawContexts.length) return

  // Set cursor on layers container
  const layersContainer = document.getElementById('layers')
  if (layersContainer) {
    layersContainer.style.cursor = 'grab'
  }

  drawContexts.forEach(context => {
    if (context && context.svg_elem) {
      // Find the SVG container which is the parent of svg_elem
      const svgContainer = context.svg_elem.closest('.svg_container') || context.svg_elem.parentNode

      // Change cursor on both elements
      context.svg_elem.style.cursor = 'grab'
      if (svgContainer) {
        svgContainer.style.cursor = 'grab'

        // Store context on both elements for easy access during drag
        svgContainer._dragContext = context
        context.svg_elem._dragContext = context

        // Attach mousedown to both container and SVG element
        svgContainer.addEventListener('mousedown', startSpaceDrag)
        context.svg_elem.addEventListener('mousedown', startSpaceDrag)

        // Make sure svg element can receive events
        context.svg_elem.style.pointerEvents = 'auto'
      }
    }
  })

  // Global event listeners
  document.addEventListener('mousemove', moveSpaceDrag)
  document.addEventListener('mouseup', endSpaceDrag)
}

export function startSpaceDrag(event) {
  if (!window._spacePressed) return

  event.preventDefault()

  isDragging = true
  dragStartX = event.clientX
  dragStartY = event.clientY

  // First try to get the context from the element's _dragContext property
  const container = event.currentTarget

  if (container && container._dragContext) {
    currentContext = container._dragContext
  } else {
    // Fall back to finding context by traversing up the DOM
    const svgContainer = event.target.closest('.svg_container')

    if (svgContainer) {
      // Try to find the context from any stored context on the container
      if (svgContainer._dragContext) {
        currentContext = svgContainer._dragContext
      } else {
        // Fall back to search through all contexts
        currentContext = getDrawContexts().find(ctx => {
          return ctx.svg_elem.closest('.svg_container') === svgContainer
        })
      }
    }
  }

  if (currentContext) {
    initialTransform = getComputedTransformMatrix(currentContext.svg_elem)

    // Change cursor to indicate dragging
    document.body.style.cursor = 'grabbing'
    if (currentContext.svg_elem) {
      currentContext.svg_elem.style.cursor = 'grabbing'
    }

    // Also change cursor on container
    const container = currentContext.svg_elem.closest('.svg_container')
    if (container) {
      container.style.cursor = 'grabbing'
    }
  }
}

export function moveSpaceDrag(event) {
  if (!isDragging || !currentContext || !initialTransform) return

  const dx = event.clientX - dragStartX
  const dy = event.clientY - dragStartY

  // Make sure we have the correct cursor during drag
  document.body.style.cursor = 'grabbing'

  // Apply the new transform
  const transform = initialTransform
  const newTransform = `matrix(${transform.a}, ${transform.b}, ${transform.c}, ${transform.d}, ${transform.e + dx}, ${transform.f + dy})`
  currentContext.svg_elem.style.transform = newTransform
}

export function endSpaceDrag() {
  if (!isDragging) return

  isDragging = false

  // Reset cursor styles
  document.body.style.cursor = ''

  if (currentContext) {
    currentContext.svg_elem.style.cursor = 'grab'

    // Reset cursor on container too
    const container = currentContext.svg_elem.closest('.svg_container')
    if (container) {
      container.style.cursor = 'grab'
    }

    currentContext = null
  }

  initialTransform = null
}

export function removeSpaceDrag() {
  // Reset cursor on the layers container
  const layersContainer = document.getElementById('layers')
  if (layersContainer) {
    layersContainer.style.cursor = ''
  }

  const drawContexts = getDrawContexts()
  if (!drawContexts || !drawContexts.length) return

  drawContexts.forEach(context => {
    if (context && context.svg_elem) {
      // Reset cursor and pointer-events on SVG element
      context.svg_elem.style.cursor = ''
      context.svg_elem.style.pointerEvents = ''

      // Remove event listener from SVG element
      context.svg_elem.removeEventListener('mousedown', startSpaceDrag)

      // Clean up stored context on SVG element
      if (context.svg_elem._dragContext) {
        delete context.svg_elem._dragContext
      }

      // Find the SVG container
      const svgContainer = context.svg_elem.closest('.svg_container') || context.svg_elem.parentNode

      if (svgContainer) {
        // Reset cursor
        svgContainer.style.cursor = ''

        // Remove event listener from container
        svgContainer.removeEventListener('mousedown', startSpaceDrag)

        // Clean up stored context on container
        if (svgContainer._dragContext) {
          delete svgContainer._dragContext
        }
      }
    }
  })

  // Remove global event listeners
  document.removeEventListener('mousemove', moveSpaceDrag)
  document.removeEventListener('mouseup', endSpaceDrag)

  isDragging = false
  currentContext = null
  initialTransform = null
}

function getComputedTransformMatrix(element) {
  try {
    const style = window.getComputedStyle(element)

    // Handle case where transform is not set or "none"
    if (!style.transform || style.transform === 'none') {
      return new DOMMatrix() // Identity matrix
    }

    return new DOMMatrix(style.transform)
  } catch (e) {
    return new DOMMatrix() // Return identity matrix on error
  }
}
