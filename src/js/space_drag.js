/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/

import * as d3 from 'd3'
import { getDrawContexts } from './app'

// Space drag implementation using D3.js
let currentContext = null
let isDragging = false

export function setupSpaceDrag() {
  const drawContexts = getDrawContexts()
  if (!drawContexts || !drawContexts.length) return

  // Set cursor on layers container
  const layersContainer = document.getElementById('layers')
  if (layersContainer) {
    layersContainer.style.cursor = 'grab'
  }

  // Define the drag behavior
  const drag = d3.drag()
    .filter(() => window._spacePressed) // Only allow dragging when space is pressed
    .on('start', startSpaceDrag)
    .on('drag', moveSpaceDrag)
    .on('end', endSpaceDrag)

  drawContexts.forEach(context => {
    if (context && context.svg_elem) {
      // Set cursor and store context
      context.svg_elem.style.cursor = 'grab'
      context.svg_elem._dragContext = context

      // Apply D3 drag behavior
      d3.select(context.svg_elem).call(drag)

      // Make sure svg element can receive events
      context.svg_elem.style.pointerEvents = 'auto'
    }
  })
}

function startSpaceDrag(event) {
  if (!window._spacePressed) return

  event.sourceEvent.preventDefault()
  event.sourceEvent.stopPropagation()

  isDragging = true

  // Get the context from the element's _dragContext property
  const container = event.sourceEvent.currentTarget
  currentContext = container._dragContext

  if (currentContext) {
    // Change cursor to indicate dragging
    document.body.style.cursor = 'grabbing'
    currentContext.svg_elem.style.cursor = 'grabbing'
  }
}

function moveSpaceDrag(event) {
  if (!isDragging || !currentContext) return

  // Get the current transform
  const transformStr = currentContext.svg_elem.style.transform || 'matrix(1, 0, 0, 1, 0, 0)'
  const matrix = parseCSSTransform(transformStr)

  // Update the transform with the drag movement
  const newTransform = `matrix(${matrix.a}, ${matrix.b}, ${matrix.c}, ${matrix.d}, ${matrix.e + event.dx}, ${matrix.f + event.dy})`
  currentContext.svg_elem.style.transform = newTransform
}

function endSpaceDrag() {
  if (!isDragging) return

  isDragging = false

  // Reset cursor styles
  document.body.style.cursor = ''
  if (currentContext) {
    currentContext.svg_elem.style.cursor = 'grab'
    currentContext = null
  }
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

      // Remove D3 drag behavior
      d3.select(context.svg_elem).on('.drag', null)

      // Clean up stored context on SVG element
      if (context.svg_elem._dragContext) {
        delete context.svg_elem._dragContext
      }

      // Find the SVG container
      const svgContainer = context.svg_elem.closest('.svg_container') || context.svg_elem.parentNode

      if (svgContainer) {
        // Reset cursor
        svgContainer.style.cursor = ''

        // Remove D3 drag behavior
        d3.select(svgContainer).on('.drag', null)

        // Clean up stored context on container
        if (svgContainer._dragContext) {
          delete svgContainer._dragContext
        }
      }
    }
  })

  // Reset all state variables
  isDragging = false
  currentContext = null
}

// Helper function to parse CSS transform matrix
function parseCSSTransform(transformStr) {
  if (!transformStr || transformStr === 'none') {
    return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 } // Identity matrix
  }

  try {
    // Handle matrix(...) format
    if (transformStr.startsWith('matrix(')) {
      const values = transformStr
        .replace('matrix(', '')
        .replace(')', '')
        .split(',')
        .map(v => parseFloat(v.trim()))

      return {
        a: values[0],
        b: values[1],
        c: values[2],
        d: values[3],
        e: values[4],
        f: values[5]
      }
    }

    // Return identity matrix if we can't parse it
    return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }
  } catch (e) {
    return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 } // Return identity matrix on error
  }
}
