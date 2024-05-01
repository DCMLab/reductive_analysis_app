/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/
import newApp from './new/app'
import { getMeiGraph } from './app'
import { captureEvent } from './new/events/options'
import { toggle_selected, toggle_shade } from './ui'
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
  roundedHull
} from './utils'

// Given a draw context ('score') and a graph node representing a relation, draw the
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

  // TODO: Other ways to draw the relations - retain as a single tree with
  // ID and type. TODO: Use classlist also for types, as in type:<type> or
  // similar
  var elem = roundedHull(notes.map(note_coords))
  elem.setAttribute('id', id)
  if (id_prefix != '')
    elem.setAttribute('oldid', g_elem.getAttribute('xml:id'))
  elem.classList.add('relation')
  elem.setAttribute('type', type)

  /**
   * Hacky way of having the shades properly initialiazed (`color` attribute).
   * Should be improved later.
   */
  // Are we running with type-specific shades?
  toggle_shade(elem)
  if (!newApp.ui.scoreSettings.brightShades)
    toggle_shade(elem)

  // Relations can be scrolled
  elem.addEventListener('wheel', e => {
    e.preventDefault()
    flip_to_bg(e.target)
    e.target.onmouseout()
  }, captureEvent)

  function undraw_meta_or_relation(draw_context, g_elem) {
    let mei_id = get_id(g_elem)
    let svg_id = draw_context.id_prefix + mei_id
    let svg_he = get_by_id(document, svg_id)
    if (!svg_he) {
      console.debug('Could not undraw relation in draw context', g_elem, draw_context)
      return false
    }
    const mei_graph = getMeiGraph()
    if (g_elem.getAttribute('type') == 'relation')
      unmark_secondaries(draw_context, mei_graph, mei_he) // @todo: Where does mei_he come from?
    var primaries = relation_primaries(mei_graph, g_elem).map(
      (e) => document.getElementById(id_in_svg(draw_context, node_to_note_id(e)))
    )
    var secondaries = relation_secondaries(mei_graph, g_elem).map(
      (e) => document.getElementById(id_in_svg(draw_context, node_to_note_id(e)))
    )
    primaries.forEach((item) => { item.classList.remove('extrahover') })
    secondaries.forEach((item) => { item.classList.remove('selecthover') })
    svg_he.parentNode.removeChild(svg_he)
    return true
  }

  // Decorate with onclick and onmouseover handlers
  elem.onclick = () => toggle_selected(elem)
  elem.onmouseover = function () {
    primaries.forEach(item => item.classList.add('extrahover'))
    secondaries.forEach(item => item.classList.add('selecthover'))
  }
  elem.onmouseout = function () {
    primaries.forEach(item => item.classList.remove('extrahover'))
    secondaries.forEach(item => item.classList.remove('selecthover'))
  }
  // TODO: Set up more onhover stuff for The Same Relation
  // Elsewhere - but perhaps that's a separate thing?

  // Add it to the SVG
  add_to_svg_bg(svg_elem, elem)
  // Remember what we're adding
  added.push(elem)
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
// export function draw_metarelation(draw_context, mei_graph, g_elem) {
//   var added = []
//   // Draw target, prefix, ID and type
//   var svg_elem = draw_context.svg_elem
//   var id_prefix = draw_context.id_prefix
//   var id = id_prefix + g_elem.getAttribute('xml:id')
//   var type = relation_type(g_elem)
//   // Get the targets - we don't differentiate primaries and secondaries in
//   // this drawing style.
//   var targets = relation_allnodes(mei_graph, g_elem).map(
//     (e) => document.getElementById(draw_context.id_prefix + get_id(e)))
//   var primaries = relation_primaries(mei_graph, g_elem).map(
//     (e) => document.getElementById(id_in_svg(draw_context, node_to_note_id(e)))
//   )
//   var secondaries = relation_secondaries(mei_graph, g_elem).map(
//     (e) => document.getElementById(id_in_svg(draw_context, node_to_note_id(e)))
//   )
//   // TODO should be possible to draw partial metarelations
//   if (targets.indexOf(null) != -1) {
//     console.log('Missing relation, not drawing metarelation')
//     return []
//   }

//   // Where are our targets
//   var coords = targets.map(get_metarelation_target)
//   // What's midpoint above them?
//   var x = average(coords.map((e) => e[0]))
//   // Above the system, and also above the relations
//   var y = targets.concat([svg_elem.getElementsByClassName('system')[0]]).map((b) => b.getBBox().y).sort((a, b) => a > b)[0] - 500

//   coords.push([x, y])
//   // We make a group
//   var g_elem = g()
//   g_elem.style.setProperty('--shade-alternate', '#000')
//   g_elem.setAttribute('id', id)
//   g_elem.classList.add('metarelation')
//   // TODO: Use classlist for types
//   g_elem.setAttribute('type', type)
//   // Draw the metarelation as a circle connected with lines to each of its
//   // targets
//   g_elem.appendChild(circle([x, y], 200))
//   coords.forEach((crds) => {
//     var line_elem = line([x, y], crds)
//     g_elem.appendChild(line_elem)
//   })

//   /**
//    * Hacky way of having the shades properly initialiazed (`color` attribute).
//    * Should be improved later.
//    */
//   // Type-dependent shades
//   toggle_shade(g_elem)
//   if (!newApp.ui.scoreSettings.brightShades)
//     toggle_shade(g_elem)

//   // We can scroll among metarelations as well
//   g_elem.addEventListener('wheel', e => {
//     e.preventDefault()
//     flip_to_bg(e.target.closest('g'))
//     e.target.onmouseout()
//   }, captureEvent)

//   // Decorate with onclick and onmouseover handlers
//   g_elem.onclick = () => toggle_selected(g_elem)
//   g_elem.onmouseover = function (ev) {
//     primaries.forEach((item) => {
//       if (item.classList.contains('relation'))
// 	    item.classList.add('extrarelationhover')
//       else
// 	    item.children[0].classList.add('extrarelationhover')
//     })
//     secondaries.forEach((item) => {
//       if (item.classList.contains('relation'))
// 	    item.classList.add('relationhover')
//       else
// 	    item.children[0].classList.add('relationhover')
//     })
//   }
//   g_elem.onmouseout = function (ev) {
//     primaries.forEach((item) => {
//       if (item.classList.contains('relation'))
// 	    item.classList.remove('extrarelationhover')
//       else
// 	    item.children[0].classList.remove('extrarelationhover')
//     })
//     secondaries.forEach((item) => {
//       if (item.classList.contains('relation'))
// 	    item.classList.remove('relationhover')
//       else
// 	    item.children[0].classList.remove('relationhover')
//     })
//   }

//   // TODO: Set up more onhover stuff for The Same Relation
//   // Elsewhere - but perhaps that's a separate thing?

//   // Add it to the SVG
//   add_to_svg_bg(svg_elem, g_elem)
//   // Remember what we're adding
//   added.push(g_elem)
//   return added
// }
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
    (e) => document.getElementById(draw_context.id_prefix + get_id(e))
  )
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

  // console.log(svg_elem)
  // Where are our targets
  var coords = targets.map(get_metarelation_target)
  // What's midpoint above them?
  var x = average(coords.map((e) => e[0]))
  // Above the system, and also above the relations
  var y = targets.concat([svg_elem.getElementsByClassName('system')[0]]).map((b) => b.getBBox().y).sort((a, b) => a > b)[0] - 500

  coords.push([x, y])
  // We make a group
  var g_elem = g()
  g_elem.style.setProperty('--shade-alternate', '#000')
  g_elem.setAttribute('id', id)
  g_elem.classList.add('metarelation')
  // TODO: Use classlist for types
  g_elem.setAttribute('type', type)
  // Draw the metarelation as a circle connected with lines to each of its
  // targets
  // var circle_elem = circle([x, y], 400)
  // g_elem.appendChild(circle_elem)
  // Draw the metarelation as a capsule
  var capsuleWidth = 800 // Width of the capsule
  var capsuleHeight = 500 // Height of the capsule
  var capsuleRadius = capsuleHeight / 2 // Radius of the semicircles at the ends

  // Draw the rectangular body
  var body = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  body.setAttribute('x', x - capsuleWidth / 2)
  body.setAttribute('y', y - capsuleHeight / 2)
  body.setAttribute('width', capsuleWidth)
  body.setAttribute('height', capsuleHeight)
  body.setAttribute('style', 'stroke: red;')
  g_elem.appendChild(body)

  // Add text inside the circle
  var text_elem = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  text_elem.setAttribute('x', x)
  text_elem.setAttribute('y', y)
  text_elem.setAttribute('text-anchor', 'middle')
  text_elem.setAttribute('dominant-baseline', 'middle')
  text_elem.setAttribute('font-size', '300px') // Set font size here
  text_elem.textContent = type // adds text about type of metarelation
  g_elem.appendChild(text_elem)

  coords.forEach((crds) => {
    var line_elem = line([x, y], crds)
    g_elem.appendChild(line_elem)
  })

  // // We make a group
  // var g_elem = g()
  // g_elem.style.setProperty('--shade-alternate', '#000')
  // g_elem.setAttribute('id', id)
  // g_elem.classList.add('metarelation')
  // // TODO: Use classlist for types
  // g_elem.setAttribute('type', type)
  // // Calculate rectangle dimensions
  // var rectWidth = 100 
  // var rectHeight = 50 
  // var rectX = x - rectWidth / 2 // X coordinate of the top-left corner of the rectangle
  // var rectY = y - rectHeight // Y coordinate of the top-left corner of the rectangle
  // g_elem.appendChild(rectangle([rectX, rectY], rectWidth, rectHeight))
  // coords.forEach((crds) => {
  //   var line_elem = line([x, y], crds)
  //   g_elem.appendChild(lineWithDot(line_elem))
  // })
  // function lineWithDot(lineElement) {
  //   var dotRadius = 5 // Radius of the dot
  //   var dot = circle([lineElement.getAttribute('x2'), lineElement.getAttribute('y2')], dotRadius)
  //   return group([lineElement, dot])
  // }
  // function rectangle(position, width, height) {
  //   var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  //   rect.setAttribute('x', position[0])
  //   rect.setAttribute('y', position[1])
  //   rect.setAttribute('width', width)
  //   rect.setAttribute('height', height)
  //   return rect
  // }
  // var g_elem = g()
  // g_elem.style.setProperty('--shade-alternate', '#000')
  // g_elem.setAttribute('id', id)
  // g_elem.classList.add('metarelation')
  // // TODO: Use classlist for types
  // g_elem.setAttribute('type', type)
  // Draw the metarelation as a circle connected with lines to each of its
  // targets
  // g_elem.appendChild(circle([x, y], 200))
  // coords.forEach((crds) => {
  //   var line_elem = line([x, y], crds)
  //   g_elem.appendChild(line_elem)

  //   // Calculate the endpoint coordinates of the line
  //   var endPointX = crds[0]
  //   var endPointY = crds[1]

  //   // Append a small dot at the end of the line
  //   var dotSize = 2
  //   var dot = circle([endPointX, endPointY], dotSize)
  //   dot.setAttribute('class', 'dot') 
  // })

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
    e.target.onmouseout()
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

// export function draw_metarelation_new(draw_context, mei_graph, g_elem, ) {}

