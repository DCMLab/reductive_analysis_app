/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/
import newApp from './new/app'
import { getMeiGraph } from './app'
import { captureEvent } from './new/events/options'
import { toggle_selected, toggle_shade, adjustSvgDimensions } from './ui'
import {
  add_to_svg_bg,
  average,
  circle,
  flip_to_bg,
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
} from './utils'

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
  var primaries = relation_primaries(mei_graph, g_elem).map(
    (e) => document.getElementById(id_in_svg(draw_context, node_to_note_id(e)))
  )
  var secondaries = relation_secondaries(mei_graph, g_elem).map(
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

  // Draw slurs between consecutive notes
  for (let i = 0; i < notes.length - 1; i++) {
    const slur = draw_slur(notes[i], notes[i + 1])

    // Store note references in the slur element
    slur.setAttribute('start-note', notes[i].id)
    slur.setAttribute('end-note', notes[i + 1].id)

    // Apply the group's color to the slur
    slur.style.stroke = getComputedStyle(group).getPropertyValue('--shade-alternate')
    group.appendChild(slur)
  }

  /**
   * Hacky way of having the shades properly initialiazed (`color` attribute).
   * Should be improved later.
   */
  // Are we running with type-specific shades?
  toggle_shade(group)
  if (!newApp.ui.scoreSettings.brightShades)
    toggle_shade(elem)

  // Relations can be scrolled
  group.addEventListener(
    'wheel',
    e => {
      e.preventDefault()
      flip_to_bg(e.target)
      e.target.onmouseout()
    },
    captureEvent
  )

  // Decorate with onclick and onmouseover handlers
  group.onclick = () => toggle_selected(group)
  group.onmouseover = function () {
    primaries.forEach(item => item.classList.add('extrahover'))
    secondaries.forEach(item => item.classList.add('selecthover'))
  }
  group.onmouseout = function () {
    primaries.forEach(item => item.classList.remove('extrahover'))
    secondaries.forEach(item => item.classList.remove('selecthover'))
  }

  // Add it to the SVG
  add_to_svg_bg(svg_elem, group)
  // Remember what we're adding
  added.push(group)

  return added
}

function redraw_relation(draw_context, g_elem) {
  var svg_g_elem = get_by_id(document, id_in_svg(draw_context, get_id(g_elem)))
  if (!svg_g_elem) {
    console.log('Unable to redraw relation: ', g_elem, ' in draw context ', draw_context)
    return
  }
  unmark_secondaries(draw_context, mei_graph, g_elem)
  svg_g_elem.parentElement.removeChild(svg_g_elem)
  svg_g_elem = draw_relation(draw_context, mei_graph, g_elem)
  mark_secondaries(draw_context, mei_graph, g_elem)
  return svg_g_elem[0]
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
  var primaries = relation_primaries(mei_graph, g_elem).map(
    (e) => document.getElementById(id_in_svg(draw_context, node_to_note_id(e)))
  )
  var secondaries = relation_secondaries(mei_graph, g_elem).map(
    (e) => document.getElementById(id_in_svg(draw_context, node_to_note_id(e)))
  )
  // TODO should be possible to draw partial metarelations
  if (targets.indexOf(null) != -1) {
    console.log('Missing relation, not drawing metarelation')
    return []
  }

  // Where are our targets
  var coords = targets.map(target => {
    const maxWidth = 80 // matches the maxWidth in draw_slur

    // Check if the target is a relation
    if (target.classList.contains('metarelation')) {
      // Get the bounding rect of the relation
      const bbox = target.getBBox()
      // Return the middle point of the upper edge
      return {
        point: [bbox.x + bbox.width / 2, bbox.y],
        width: maxWidth
      }
    } else {
      // If the target is a relation slur, return the middle point of the slur
      const slurs = Array.from(target.getElementsByTagName('path'))
      if (slurs.length === 0) return { point: get_metarelation_target(target), width: 80 }

      // Find the highest point and corresponding width of all slurs in this relation
      const slurInfo = slurs.map(slur => {
        const bbox = slur.getBBox()
        return {
          point: [bbox.x + bbox.width / 2, bbox.y],
          width: maxWidth
        }
      })

      // Return the highest point and its corresponding width
      return slurInfo.reduce((highest, current) =>
        current.point[1] < highest.point[1] ? current : highest
      )
    }
  })

  // What's midpoint above them?
  var x = average(coords.map((e) => e.point[0]))
  let yOffset = -400
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
      const adjustedPoint = [info.point[0], info.point[1] + radius / 2]
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

        window.metaRelationInstance?.updateToggles()
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

  // We can scroll among metarelations as well
  g_elem.addEventListener('wheel', e => {
    e.preventDefault()
    flip_to_bg(e.target.closest('g'))
    // Only call onmouseout if it exists
    if (e.target.onmouseout) {
      e.target.onmouseout()
    }
  }, captureEvent)

  // Decorate with onclick and onmouseover handlers
  g_elem.onclick = () => toggle_selected(g_elem)
  g_elem.onmouseover = function (ev) {
    primaries.forEach((item) => {
      if (item.classList.contains('relation'))
	    item.classList.add('extrarelationhover')
      else
	    item.children[0].classList.add('extrarelationhover')
    })
    secondaries.forEach((item) => {
      if (item.classList.contains('relation'))
	    item.classList.add('relationhover')
      else
	    item.children[0].classList.add('relationhover')
    })
  }
  g_elem.onmouseout = function (ev) {
    primaries.forEach((item) => {
      if (item.classList.contains('relation'))
	    item.classList.remove('extrarelationhover')
      else
	    item.children[0].classList.remove('extrarelationhover')
    })
    secondaries.forEach((item) => {
      if (item.classList.contains('relation'))
	    item.classList.remove('relationhover')
      else
	    item.children[0].classList.remove('relationhover')
    })
  }

  // TODO: Set up more onhover stuff for The Same Relation
  // Elsewhere - but perhaps that's a separate thing?

  // Add it to the SVG
  add_to_svg_bg(svg_elem, g_elem)
  // Remember what we're adding
  added.push(g_elem)

  return added
}
