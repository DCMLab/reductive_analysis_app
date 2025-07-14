/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/
import newApp from '../app'
import { captureEvent } from '../events/options'
import { toggle_selected, toggle_shade } from '../modules/UI/utils/misc'
import {
  add_to_svg_bg,
  average,
  circle,
  g,
  get_id,
  get_metarelation_target,
  id_in_svg,
  line,
  node_to_note_id,
  note_coords,
  relation_allnodes,
  relation_primaries,
  relation_secondaries,
  relation_type,
  draw_slur,
  isSlurDownward,
  get_by_id,
  handleFlip
} from '../utils/misc'

// Given a draw context and a graph node representing a relation, draw the
// relation in the draw context.
export function draw_relation(draw_context, mei_graph, g_elem) {
  var added = []
  // Where are we drawing, and with what prefix?
  var svg_elem = draw_context.svg_elem
  var id_prefix = draw_context.id_prefix
  // ID and type
  var id = id_prefix + g_elem.getAttribute('xml:id')
  var type = relation_type(g_elem)
  // What are the primary and secondary notes in the draw context?
  var p = relation_primaries(mei_graph, g_elem)
  var primaries = p.map(
    (e) => document.getElementById(id_in_svg(draw_context, node_to_note_id(e)))
  )
  var s = relation_secondaries(mei_graph, g_elem)
  var secondaries = s.map(
    (e) => document.getElementById(id_in_svg(draw_context, node_to_note_id(e)))
  )
  var notes = primaries.concat(secondaries)
  notes.sort((a, b) => {
    if (!a) return -1
    if (!b) return 1
    var p1 = note_coords(a)
    var p2 = note_coords(b)
    return (p1[0] - p2[0]) ? (p1[0] - p2[0]) : (p1[1] - p2[1])
  })
  // TODO: Should be able to draw relations that are not complete
  if (!notes[0]) {
    console.log('Note missing, relation not drawn')
    return null
  }

  // Create a group element to hold all slurs
  var group = g()
  group.setAttribute('id', id)
  if (id_prefix != '') group.setAttribute('oldid', g_elem.getAttribute('xml:id'))
  group.classList.add('relation')
  group.setAttribute('type', type)

  // Draw a single slur from first note to last note
  if (notes.length >= 2) {
    const firstNote = notes[0]
    const lastNote = notes[notes.length - 1]
    // Downward slur if both notes are below the system's midpoint
    const isDownward = isSlurDownward(svg_elem, firstNote, lastNote)
    // Create the single slur from first to last note
    const slur = draw_slur(firstNote, lastNote, isDownward)

    // Store note references in the slur element
    slur.setAttribute('start-note', firstNote.id)
    slur.setAttribute('end-note', lastNote.id)

    // Apply the group's color to the slur
    slur.style.stroke = getComputedStyle(group).getPropertyValue('--shade-alternate')

    group.appendChild(slur)
    group.setAttribute('is-downward', isDownward)

    // Add jots for any middle notes on the slur
    if (notes.length > 2) {
      // Get the length of the path for measurements
      const pathLength = slur.getTotalLength()
      const curveLength = pathLength / 2 // Top curve is roughly the first half

      // Draw jots for middle notes
      for (let i = 1; i < notes.length - 1; i++) {
        const middleNote = notes[i]
        const coords = note_coords(middleNote)

        // Find the point on the top curve that best matches the x-coordinate of the middle note
        let bestPoint = null
        let minDistance = Infinity

        // Sample points along the top curve to find the closest one to our x-coordinate
        const numSamples = 100
        for (let j = 0; j <= numSamples; j++) {
          const samplePosition = j / numSamples * curveLength
          const point = slur.getPointAtLength(samplePosition)

          // Calculate distance to the target x-coordinate
          const xDistance = Math.abs(point.x - coords[0])

          if (xDistance < minDistance) {
            minDistance = xDistance
            bestPoint = point
          }
        }

        // Use the best point for the jot position
        if (bestPoint) {
          const jot = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
          const size = 100 // Size is double the radius to maintain similar visual size

          // Position the rect - need to offset by half the size to center it on the bestPoint
          jot.setAttribute('x', bestPoint.x - size / 4)
          jot.setAttribute('y', isDownward ? bestPoint.y - size * 0.75 : bestPoint.y - size / 4)
          jot.setAttribute('width', size / 2)
          jot.setAttribute('height', size)
          jot.style.fill = getComputedStyle(group).getPropertyValue('--shade-alternate')
          jot.setAttribute('middle-note', middleNote.id)

          // Create a dashed line connecting the middle note to the jot
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
          const baseOffsetY = 150
          line.setAttribute('x1', coords[0])
          line.setAttribute('y1', isDownward ? coords[1] + baseOffsetY : coords[1] - baseOffsetY)
          line.setAttribute('x2', bestPoint.x)
          line.setAttribute('y2', isDownward ? bestPoint.y - size : bestPoint.y + size) // Connect to the middle of the square
          line.setAttribute('stroke', 'currentColor')
          line.setAttribute('stroke-width', '30px')
          line.setAttribute('stroke-dasharray', '100 100')
          line.classList.add('relation-jot-line')

          // Add connection line and jot to the group
          group.appendChild(line)
          group.appendChild(jot)
        }
      }
    }
  }

  /**
   * Hacky way of having the shades properly initialiazed (`color` attribute).
   * Should be improved later.
   */
  // Are we running with type-specific shades?
  toggle_shade(group)
  // if (!newApp.ui.scoreSettings.brightShades)
  // toggle_shade(elem)

  group.addEventListener('wheel', handleFlip, captureEvent)

  // Decorate with onclick and onmouseover handlers
  group.onclick = () => {
    primaries.forEach(item => {
      if (item.classList.contains('relation-select-primary')) {
        item.classList.remove('relation-select-primary')
      } else {
        item.classList.add('relation-select-primary')
      }
    })
    secondaries.forEach(item => {
      if (item.classList.contains('relation-select-secondary')) {
        item.classList.remove('relation-select-secondary')
      } else {
        item.classList.add('relation-select-secondary')
      }
    })
    toggle_selected(group)
  }
  group.onmouseover = function () {
    addHoverClassToChildren(group, true, true, draw_context, mei_graph)
  }
  group.onmouseout = function () {
    removeHoverClassToChildren(group, true, true, draw_context, mei_graph)
  }

  // Add it to the SVG
  add_to_svg_bg(svg_elem, group)
  // Remember what we're adding
  added.push(group)

  return added
}

// Essentially the same procedure as above, but for metarelations
export function draw_metarelation(draw_context, mei_graph, g_elem) {
  var added = []
  // Draw target, prefix, ID and type
  var svg_elem = draw_context.svg_elem
  var id_prefix = draw_context.id_prefix
  var id = id_prefix + g_elem.getAttribute('xml:id')
  var type = relation_type(g_elem)
  // Get the targets - we don't differentiate primaries and secondaries in
  // this drawing style.
  var targets = relation_allnodes(mei_graph, g_elem).map(
    (e) => document.getElementById(draw_context.id_prefix + get_id(e)))
  // TODO should be possible to draw partial metarelations
  if (targets.indexOf(null) != -1) {
    console.log('Missing relation, not drawing metarelation')
    return []
  }

  const isDownward = targets.every(target => target.getAttribute('is-downward') === 'true')

  // Where are our targets
  var coords = targets.map(target => {
    const maxWidth = 100 // matches the maxWidth in draw_slur

    // Check if the target is a metarelation
    if (target.classList.contains('metarelation')) {
      // Get the bounding rect of the relation
      const bbox = target.getBBox()
      // Return the middle point of the upper edge
      return isDownward ? {
        point: [bbox.x + bbox.width / 2, bbox.y + bbox.height],
        width: maxWidth
      } : {
        point: [bbox.x + bbox.width / 2, bbox.y],
        width: maxWidth
      }
    } else {
      // If the target is a relation slur, return the middle point of the slur
      const slurs = Array.from(target.getElementsByTagName('path'))
      if (slurs.length === 0) return { point: get_metarelation_target(target), width: 80 }

      // Find the middle point of each slur by calculating the point halfway along the path
      const slurInfo = slurs.map(slur => {
        // Get the total length of the path
        const pathLength = slur.getTotalLength()
        // Get the point that's halfway along the path
        const midPoint = slur.getPointAtLength(pathLength / 4)

        return {
          // Return the actual midpoint of the slur
          point: [midPoint.x, midPoint.y],
          width: maxWidth,
        }
      })
      return isDownward ? slurInfo.reduce((lowest, current) =>
        current.point[1] > lowest.point[1] ? current : lowest
      ) : slurInfo.reduce((highest, current) =>
        current.point[1] < highest.point[1] ? current : highest
      )
    }
  })

  // What's midpoint above them?
  var x = average(coords.map((e) => e.point[0]))
  let yOffset = isDownward ? 400 : -400
  var y = Math.min(...coords.map(c => c.point[1])) + yOffset

  // Store original coords for line connections
  var connectionPoints = [...coords]
  coords.push({ point: [x, y], width: 80 })
  // We make a group
  var g_elem = g()
  g_elem.style.setProperty('--shade-alternate', '#000')
  g_elem.setAttribute('id', id)
  g_elem.classList.add('metarelation')
  // TODO: Use classlist for types
  g_elem.setAttribute('type', type)
  g_elem.setAttribute('start-relation', targets[0].id)
  g_elem.setAttribute('end-relation', targets[1].id)
  g_elem.setAttribute('is-downward', isDownward)
  // Draw the metarelation as a circle connected with lines to each of its
  // targets
  const rectHeight = 250
  const cornerRadius = 30
  const padding = 100 // Padding on each side

  // Create temporary SVG element for accurate text measurement
  const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  document.body.appendChild(tempSvg)

  // Create text element for measurement
  const tempText = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  tempText.style.fontSize = '200px'
  tempText.textContent = type
  tempSvg.appendChild(tempText)
  const textWidth = tempText.getBBox().width
  document.body.removeChild(tempSvg)

  const rectWidth = textWidth + (padding * 2)

  // Create rounded rectangle with width based on text
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  rect.setAttribute('x', x - rectWidth / 2)
  rect.setAttribute('y', y - rectHeight / 2)
  rect.setAttribute('width', rectWidth)
  rect.setAttribute('height', rectHeight)
  rect.setAttribute('rx', cornerRadius)
  rect.setAttribute('ry', cornerRadius)
  rect.style.fill = getComputedStyle(g_elem).getPropertyValue('--shade-alternate')

  // Create actual text element
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  text.setAttribute('x', x)
  text.setAttribute('y', y)
  text.setAttribute('text-anchor', 'middle')
  text.setAttribute('dominant-baseline', 'middle')
  text.setAttribute('fill', 'white')
  text.style.fontSize = '200px'
  text.classList.add('metarelation-text')
  text.textContent = type

  // Add rectangle and text in correct order
  g_elem.appendChild(rect)
  g_elem.appendChild(text)

  connectionPoints.forEach((info) => {
    // Calculate where the line should start from the rectangle's edge
    const dx = info.point[0] - x
    const dy = info.point[1] - y

    // Calculate the point where the line intersects the rectangle
    // Consider both the width and height of the rectangle
    let intersectX, intersectY

    // Calculate the ratio of the rectangle's dimensions
    const ratio = Math.abs(dy / dx)
    const halfWidth = rectWidth / 2
    const halfHeight = rectHeight / 2

    if (ratio < halfHeight / halfWidth) {
      // Line intersects with vertical edge
      intersectX = dx > 0 ? x + halfWidth : x - halfWidth
      intersectY = y + (dy * halfWidth / Math.abs(dx))
    } else {
      // Line intersects with horizontal edge
      intersectY = dy > 0 ? y + halfHeight : y - halfHeight
      intersectX = x + (dx * halfHeight / Math.abs(dy))
    }

    // Draw the connection line from the intersection point
    var line_elem = line([intersectX, intersectY], info.point)
    g_elem.appendChild(line_elem)

    // Check if target already has a connection circle
    const target = targets[connectionPoints.indexOf(info)]
    let connection_circle = target.querySelector('.connection-circle')

    if (!connection_circle) {
      // Draw a connection circle at the connection point if not already present
      const radius = info.width / 2
      const adjustedPoint = [info.point[0], isDownward ? info.point[1] - radius / 2 : info.point[1] + radius / 2]
      connection_circle = circle(adjustedPoint, radius)
      connection_circle.style.fill = 'white'
      connection_circle.style.stroke = '#000'
      connection_circle.style.cursor = 'pointer'
      connection_circle.classList.add('connection-circle')
      // Generate a unique ID for the connection circle if it doesn't have one
      const circleId = `circle-${target.id}`
      connection_circle.setAttribute('id', circleId)

      // Calculate where the line should end at the circle's edge
      const lineStartX = parseFloat(line_elem.getAttribute('x1'))
      const lineStartY = parseFloat(line_elem.getAttribute('y1'))
      const circleCenterX = adjustedPoint[0]
      const circleCenterY = adjustedPoint[1]

      // Calculate the angle between the line and the circle center
      const dx = circleCenterX - lineStartX
      const dy = circleCenterY - lineStartY
      const angle = Math.atan2(dy, dx)

      // Calculate the point where the line should end at the circle's edge
      const endX = circleCenterX - (radius * Math.cos(angle))
      const endY = circleCenterY - (radius * Math.sin(angle))

      // Update the line endpoint to stop at the circle's edge
      line_elem.setAttribute('x2', endX)
      line_elem.setAttribute('y2', endY)

      // Set the connection circle ID on the line element
      line_elem.setAttribute('circle:id', circleId)

      // Add click event listener for toggle show/hide functionality
      connection_circle.addEventListener('click', (e) => {
        e.stopPropagation() // Prevent event from bubbling to parent elements

        // Find all metarelations connected to this target
        const connectedMetarelations = Array.from(document.querySelectorAll('.metarelation')).filter(meta => {
          const startId = meta.getAttribute('start-relation')
          const endId = meta.getAttribute('end-relation')
          return startId === target.id || endId === target.id
        })

        // Function to recursively hide a metarelation and its parents
        const recursiveHide = (metarelation) => {
          // Hide current metarelation
          metarelation.classList.add('hidden')

          // Find parent metarelations
          const parentMetarelations = Array.from(document.querySelectorAll('.metarelation')).filter(meta => {
            const startId = meta.getAttribute('start-relation')
            const endId = meta.getAttribute('end-relation')
            return startId === metarelation.id || endId === metarelation.id
          })

          // Recursively hide parents
          parentMetarelations.forEach(parent => recursiveHide(parent))
        }

        connectedMetarelations.forEach(metarelation => {
          const isHidden = metarelation.classList.contains('hidden')

          if (isHidden) {
            // Show operation - only show this level
            metarelation.classList.remove('hidden')
          } else {
            // Hide operation - recursively hide this level and all parents
            recursiveHide(metarelation)
          }
        })

        newApp.ui.layersMenu.metaRelation?.updateToggles()
      })

      // Add the circle to the target
      target.appendChild(connection_circle)
    }
  })

  /**
   * Hacky way of having the shades properly initialiazed (`color` attribute).
   * Should be improved later.
   */
  // Type-dependent shades
  toggle_shade(g_elem)
  if (!newApp.ui.scoreSettings.brightShades)
    toggle_shade(g_elem)

  // We can scroll among metarelations with wheel
  g_elem.addEventListener('wheel', handleFlip, captureEvent)

  // Decorate with onclick and onmouseover handlers
  g_elem.onclick = () => toggle_selected(g_elem)
  g_elem.onmouseover = function (ev) {
    addHoverClassToChildren(g_elem, true, true, draw_context, mei_graph)
  }
  g_elem.onmouseout = function (ev) {
    removeHoverClassToChildren(g_elem, true, true, draw_context, mei_graph)
  }

  // TODO: Set up more onhover stuff for The Same Relation
  // Elsewhere - but perhaps that's a separate thing?

  // Add it to the SVG
  add_to_svg_bg(svg_elem, g_elem)
  // Remember what we're adding
  added.push(g_elem)

  return added
}

// Recursively add hover class to elements and their children
function addHoverClassToChildren(element, isRoot, isPrimary, draw_context, mei_graph) {
  if (!element) return

  // For meta-relations
  if (element.classList.contains('metarelation') || element.classList.contains('relation')) {
    // Add hover class to the meta-relation itself
    if (!isRoot) element.classList.add(isPrimary ? 'extrarelationhover' : 'relationhover')

    // Get the corresponding MEI node using the oldid attribute
    let meiNode = get_by_id(mei_graph, element.getAttribute('oldid') || element.id)

    // Recursively add hover class to the children
    let primaries = relation_primaries(mei_graph, meiNode).map(
      (e) => document.getElementById(id_in_svg(draw_context, node_to_note_id(e)))
    )
    let secondaries = relation_secondaries(mei_graph, meiNode).map(
      (e) => document.getElementById(id_in_svg(draw_context, node_to_note_id(e)))
    )

    primaries.forEach(elem => { addHoverClassToChildren(elem, false, true, draw_context, mei_graph) })
    secondaries.forEach(elem => { addHoverClassToChildren(elem, false, false, draw_context, mei_graph) })

  } else if (element.classList.contains('note')) {
    // Add hover class to the note itself (note is never a root)
    element.classList.add(isPrimary ? 'extrahover' : 'selecthover')
  }
}

// Recursively remove hover class from elements and their children
function removeHoverClassToChildren(element, isRoot, isPrimary, draw_context, mei_graph) {
  if (!element) return

  // For meta-relations
  if (element.classList.contains('metarelation') || element.classList.contains('relation')) {
    // Remove hover class from the meta-relation itself
    if (!isRoot) element.classList.remove(isPrimary ? 'extrarelationhover' : 'relationhover')

    // Get the corresponding MEI node using the oldid attribute
    // TODO: might be undefined and produce error
    let meiNode = get_by_id(mei_graph, element.getAttribute('oldid') || element.id)

    // Recursively remove hover class from the children
    let primaries = relation_primaries(mei_graph, meiNode).map(
      (e) => document.getElementById(id_in_svg(draw_context, node_to_note_id(e)))
    )
    let secondaries = relation_secondaries(mei_graph, meiNode).map(
      (e) => document.getElementById(id_in_svg(draw_context, node_to_note_id(e)))
    )

    primaries.forEach(elem => { removeHoverClassToChildren(elem, false, true, draw_context, mei_graph) })
    secondaries.forEach(elem => { removeHoverClassToChildren(elem, false, false, draw_context, mei_graph) })

  } else if (element.classList.contains('note')) {
    // Remove hover class from the note itself (note is never a root)
    element.classList.remove(isPrimary ? 'extrahover' : 'selecthover')
  }
}
