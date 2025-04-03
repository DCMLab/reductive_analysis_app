/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2025  Yinan Zhou, Yannis Rammos, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/

import $ from 'jquery'
import { getDrawContexts } from './app'

// Option drag implementation for metarelations
let isDragging = false
let dragStartX = 0
let dragStartY = 0
let currentMetarelation = null
let currentRect = null
let currentText = null
let currentLines = []
let currentCircles = []
let initialRectTransform = null

export function setupOptionDrag() {
  const drawContexts = getDrawContexts()
  if (!drawContexts || !drawContexts.length) return

  drawContexts.forEach(context => {
    if (context && context.svg_elem) {
      // Find all metarelations
      const metarelations = context.svg_elem.getElementsByClassName('metarelation')

      Array.from(metarelations).forEach(metarelation => {
        metarelation.style.cursor = 'move'

        // Store context on the element
        metarelation._dragContext = context

        // Add mousedown listener
        metarelation.addEventListener('mousedown', startOptionDrag)
      })
    }
  })

  // Global event listeners
  document.addEventListener('mousemove', moveOptionDrag)
  document.addEventListener('mouseup', endOptionDrag)
}

export function startOptionDrag(event) {
  if (!window._optionPressed) return

  event.preventDefault()
  event.stopPropagation() // Prevent other drag behaviors

  isDragging = true

  // Get SVG element and its CTM (Current Transform Matrix)
  const svg = event.currentTarget.closest('svg')
  const svgPoint = svg.createSVGPoint()
  svgPoint.x = event.clientX
  svgPoint.y = event.clientY
  const transformedPoint = svgPoint.matrixTransform(svg.getScreenCTM().inverse())

  dragStartX = transformedPoint.x
  dragStartY = transformedPoint.y

  // Get the metarelation group element
  currentMetarelation = event.currentTarget

  // Trigger mouseout if it exists to clean up any hover states
  if (currentMetarelation.onmouseout) {
    currentMetarelation.onmouseout()
  }

  // Get the rectangle, text, lines and circles
  currentRect = currentMetarelation.querySelector('rect')
  currentText = currentMetarelation.querySelector('text')
  currentLines = Array.from(currentMetarelation.getElementsByTagName('line'))
  currentCircles = Array.from(currentMetarelation.getElementsByTagName('circle'))

  if (currentRect) {
    // Store initial transform and position
    initialRectTransform = {
      x: parseFloat(currentRect.getAttribute('x')),
      y: parseFloat(currentRect.getAttribute('y')),
      width: parseFloat(currentRect.getAttribute('width')),
      height: parseFloat(currentRect.getAttribute('height'))
    }
  }

  // Change cursor to indicate dragging
  document.body.style.cursor = 'move'
}

export function moveOptionDrag(event) {
  if (!isDragging || !currentMetarelation || !currentRect || !initialRectTransform) return

  // Convert screen coordinates to SVG coordinates
  const svg = currentMetarelation.closest('svg')
  const svgPoint = svg.createSVGPoint()
  svgPoint.x = event.clientX
  svgPoint.y = event.clientY
  const transformedPoint = svgPoint.matrixTransform(svg.getScreenCTM().inverse())

  const dx = transformedPoint.x - dragStartX
  const dy = transformedPoint.y - dragStartY

  // Update rectangle position
  const newRectX = initialRectTransform.x + dx
  const newRectY = initialRectTransform.y + dy
  currentRect.setAttribute('x', newRectX)
  currentRect.setAttribute('y', newRectY)

  // Update text position to stay centered in rectangle
  if (currentText) {
    // Calculate center of rectangle
    const rectCenterX = newRectX + initialRectTransform.width / 2
    const rectCenterY = newRectY + initialRectTransform.height / 2

    // Update text position to stay centered
    currentText.setAttribute('x', rectCenterX)
    currentText.setAttribute('y', rectCenterY)
  }

  // Update line end points that connect to the rectangle
  currentLines.forEach(line => {
    // Calculate the center of the moved rectangle
    const rectCenterX = newRectX + initialRectTransform.width / 2
    const rectCenterY = newRectY + initialRectTransform.height / 2

    // Get the other end point (the one connecting to the note)
    const x2 = parseFloat(line.getAttribute('x2'))
    const y2 = parseFloat(line.getAttribute('y2'))

    // Calculate intersection point with rectangle
    let intersectX, intersectY
    const halfWidth = initialRectTransform.width / 2
    const halfHeight = initialRectTransform.height / 2
    const ratio = Math.abs((y2 - rectCenterY) / (x2 - rectCenterX))

    if (ratio < halfHeight / halfWidth) {
      // Line intersects with vertical edge
      intersectX = x2 > rectCenterX ? rectCenterX + halfWidth : rectCenterX - halfWidth
      intersectY = rectCenterY + (y2 - rectCenterY) * halfWidth / Math.abs(x2 - rectCenterX)
    } else {
      // Line intersects with horizontal edge
      intersectY = y2 > rectCenterY ? rectCenterY + halfHeight : rectCenterY - halfHeight
      intersectX = rectCenterX + (x2 - rectCenterX) * halfHeight / Math.abs(y2 - rectCenterY)
    }

    // Update line start point
    line.setAttribute('x1', intersectX)
    line.setAttribute('y1', intersectY)
  })
}

export function endOptionDrag() {
  if (!isDragging) return

  isDragging = false
  document.body.style.cursor = ''

  // Trigger mouseout if it exists to clean up any hover states
  if (currentMetarelation?.onmouseout) {
    currentMetarelation.onmouseout()
  }

  // Reset variables
  currentMetarelation = null
  currentRect = null
  currentText = null
  currentLines = []
  currentCircles = []
  initialRectTransform = null
}

export function removeOptionDrag() {
  const drawContexts = getDrawContexts()
  if (!drawContexts || !drawContexts.length) return

  drawContexts.forEach(context => {
    if (context && context.svg_elem) {
      // Find all metarelations
      const metarelations = context.svg_elem.getElementsByClassName('metarelation')

      Array.from(metarelations).forEach(metarelation => {
        // Reset cursor
        metarelation.style.cursor = ''

        // Remove event listener
        metarelation.removeEventListener('mousedown', startOptionDrag)

        // Clean up stored context
        if (metarelation._dragContext) {
          delete metarelation._dragContext
        }
      })
    }
  })

  // Remove global event listeners
  document.removeEventListener('mousemove', moveOptionDrag)
  document.removeEventListener('mouseup', endOptionDrag)

  // Reset all state
  isDragging = false
  currentMetarelation = null
  currentRect = null
  currentText = null
  currentLines = []
  currentCircles = []
  initialRectTransform = null
}
