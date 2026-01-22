/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/
import { polygonHull } from 'd3-polygon'
// import fuzzysearch from 'fuzzysearch'

import { getDrawContexts, getMeiGraph, getVerovioToolkit } from '../bootstrap'
import { strip_mei_tags, strip_xml_tags } from '../conf'
import { toggle_selected, getMouseX, getMouseY } from '../modules/UI/utils/misc'

// Vector operations, taken from
// http://bl.ocks.org/hollasch/f70f1fe7700f092b5a505e3efd1d9232
var vecScale = function(scale, v) {
  // Returns the vector 'v' scaled by 'scale'.
  return [scale * v[0], scale * v[1]]
}

var vecSum = function(pv1, pv2) {
  // Returns the sum of two vectors, or a combination of a point and a
  // vector.
  return [pv1[0] + pv2[0], pv1[1] + pv2[1]]
}

var unitNormal = function(p0, p1) {
  // Returns the unit normal to the line segment from p0 to p1.
  var n = [p0[1] - p1[1], p1[0] - p0[0]]
  var nLength = Math.sqrt(n[0] * n[0] + n[1] * n[1])
  return [n[0] / nLength, n[1] / nLength]
}

// Returns the path for a rounded hull around a single point (a circle).
var roundedHull1 = function(polyPoints, hullPadding) {
  const p1 = [polyPoints[0][0], polyPoints[0][1] - hullPadding]
  const p2 = [polyPoints[0][0], parseInt(polyPoints[0][1]) + parseInt(hullPadding)]

  return `M ${p1} A `
    + [hullPadding, hullPadding, '0,0,0', p2].join(',')
    + ' A '
    + [hullPadding, hullPadding, '0,0,0', p1].join(',')
}

// Returns the path for a rounded hull around two points (a "capsule" shape).
var roundedHull2 = function(polyPoints, hullPadding) {
  var offsetVector = vecScale(hullPadding, unitNormal(polyPoints[0], polyPoints[1]))
  var invOffsetVector = vecScale(-1, offsetVector)
  // around that note coordinates are not at the centroids

  var p0 = vecSum(polyPoints[0], offsetVector)
  var p1 = vecSum(polyPoints[1], offsetVector)
  var p2 = vecSum(polyPoints[1], invOffsetVector)
  var p3 = vecSum(polyPoints[0], invOffsetVector)

  return `M ${p0} L ${p1} A `
    + [hullPadding, hullPadding, '0,0,0', p2].join(',')
    + ` L ${p3} A `
    + [hullPadding, hullPadding, '0,0,0', p0].join(',')
}

// Returns the SVG path data string representing the polygon, expanded and rounded.
var roundedHullN = function(polyPoints, hullPadding) {

  // Handle special cases
  if (!polyPoints || polyPoints.length < 1) return ''
  if (polyPoints.length === 1) return roundedHull1(polyPoints, hullPadding)
  if (polyPoints.length === 2) return roundedHull2(polyPoints, hullPadding)

  var segments = new Array(polyPoints.length)

  // Calculate each offset (outwards) segment of the convex hull.
  for (var segmentIndex = 0; segmentIndex < segments.length; ++segmentIndex) {
    var p0 = (segmentIndex === 0) ? polyPoints[polyPoints.length - 1] : polyPoints[segmentIndex - 1]
    var p1 = polyPoints[segmentIndex]

    // Compute the offset vector for the line segment, with length = hullPadding.
    var offset = vecScale(hullPadding, unitNormal(p0, p1))

    segments[segmentIndex] = [vecSum(p0, offset), vecSum(p1, offset)]
  }

  var arcData = 'A ' + [hullPadding, hullPadding, '0,0,0,'].join(',')

  segments = segments.map(function(segment, index) {
    var pathFragment = ''
    if (index === 0) {
      var pathFragment = 'M ' + segments[segments.length - 1][1] + ' '
    }
    pathFragment += arcData + segment[0] + ' L ' + segment[1]

    return pathFragment
  })

  return segments.join(' ')
}

export function roundedHull(points) {
  var draw_contexts = getDrawContexts()
  var hullPadding = draw_contexts.hullPadding || 200

  // Returns an SVG path for a rounded hull around the points
  var path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  // TODO: Better colour picking
  path.style.setProperty('--shade-alternate', randomColor())
  if (points.length == 1) {
    path.setAttribute('d', roundedHull1(points, hullPadding))
  } else if (points.length == 2) {
    path.setAttribute('d', roundedHull2(points, hullPadding))
  } else {
    path.setAttribute('d', roundedHullN(polygonHull(points), hullPadding))
  }
  return path
}

function randomColor() {
  const hexChars = '456789AB' // characters pool for hex color
  let color = '#'
  for (let i = 0; i < 6; i++) {
    color += hexChars[Math.floor(Math.random() * hexChars.length)]
  }
  return color
}

// Draw a line between points p1 and p2
export function line(p1, p2) {
  var newElement = document.createElementNS('http://www.w3.org/2000/svg', 'line')
  newElement.setAttribute('x1', p1[0])
  newElement.setAttribute('y1', p1[1])
  newElement.setAttribute('x2', p2[0])
  newElement.setAttribute('y2', p2[1])
  newElement.style.stroke = '#000'
  newElement.style.strokeWidth = '15px'
  return newElement
}

// Draw a circle at point p with radius rad
export function circle(p, rad) {
  var newElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  newElement.setAttribute('cx', p[0])
  newElement.setAttribute('cy', p[1])
  newElement.setAttribute('r', rad)
  newElement.style.stroke = '#000'
  newElement.style.strokeWidth = '15px'
  return newElement
}

// Draw a rectangle at point p with width/height
export function rect(p, width, height) {
  var newElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  newElement.setAttribute('x', p[0])
  newElement.setAttribute('y', p[1])
  newElement.setAttribute('width', width)
  newElement.setAttribute('height', height)
  newElement.style.stroke = '#000'
  newElement.style.fill = 'white'
  newElement.style.strokeWidth = '15px'
  return newElement
}

// Draw a text at point p
export function text(text, p) {
  var newElement = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  if (p) {
    newElement.setAttribute('x', p[0])
    newElement.setAttribute('y', p[1])
  }
  newElement.append(text)
  return newElement
}

// Make a tspan with dx,dy
export function tspan(text, p, dy, dx = 0) {
  var newElement = document.createElementNS('http://www.w3.org/2000/svg', 'tspan')
  newElement.setAttribute('x', p[0])
  newElement.setAttribute('dx', dx)
  newElement.setAttribute('dy', dy)
  newElement.append(text)
  return newElement
}

/**
 * Send given SVG to the background.
 * Probably could be replaced by cycling CSS `z-index`.
 */
export function flip_to_bg(elem) {
  if (!elem || !elem.parentElement) return
  elem.parentElement.prepend(elem)
}

export function add_to_svg_bg(svg_elem, newElement) {
  // Adds newElement in the background of the system element
  var sibling = svg_elem.getElementsByClassName('system')[0]
  var parent = sibling.parentNode
  parent.insertBefore(newElement, sibling)
}

export function g() {
  // Creates a new SVG g element
  var newElement = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  return newElement
}

export function random_id(length = 8) {
  const l = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const d = '0123456789'
  const v = l + d + '-._'

  const firstChar = (l + '_')[Math.floor(Math.random() * (l.length + 1))]

  let remaining = ''
  for (let i = 0; i < length - 1; i++) {
    remaining += v[Math.floor(Math.random() * v.length)]
  }

  return firstChar + remaining
}

export function pitch_offset(n1, n2) {
  var vrvToolkit = getVerovioToolkit()
  // Pitch offset in MIDI steps
  return vrvToolkit.getMIDIValuesForElement(get_id(n1)).pitch -
    vrvToolkit.getMIDIValuesForElement(get_id(n2)).pitch
}

export function time_offset(n1, n2) {
  var vrvToolkit = getVerovioToolkit()
  // Time offset in MIDI milliseconds
  return vrvToolkit.getMIDIValuesForElement(get_id(n1)).time -
    vrvToolkit.getMIDIValuesForElement(get_id(n2)).time
}

export function notes_template(ns) {
  // For a number of notes, generate a map of pitch/time offsets to the
  // earliest, lowest note
  var ns_temp = ns
  ns_temp = ns_temp.sort(pitch_offset)
  ns_temp = ns_temp.sort(time_offset)
  var ns_relative = ns_temp.map((n) => {
    return {
      p_off: pitch_offset(n, ns_temp[0]),
      t_off: time_offset(n, ns_temp[0]),
      n_from: n
    }
  })
  return ns_relative
}

export function notes_in_range(n_ref, min_p_off, max_p_off, max_t_off) {
  // Given a note, a pitch offset range, and a time range, find all notes
  // within that range
  var curr_measure = n_ref.closest('measure')
  var ns = []
  while (curr_measure) {
    let none_added = true
    let c_ns = curr_measure.querySelectorAll('note')
    for (let m of c_ns) {
      let t_off = time_offset(m, n_ref)
      if (t_off >= 0 && t_off <= max_t_off) {
        console.log('in time')
        let p_off = pitch_offset(m, n_ref)
        if (p_off >= min_p_off && p_off <= max_p_off) {
          console.log('in pitch')
          none_added = false
          ns.push(m)
        }
      }
    }
    if (none_added) // TODO: Better check - there could be measures with no
      // notes in the pitch range that are still in the time
      // range
      curr_measure = null
    else
      curr_measure = next_measure(curr_measure)
  }
  return ns
}

export function next_measure(m) {
  if (m.nextElementSibling && m.nextElementSibling.tagName == 'measure')
    return m.nextElementSibling
  else if (!m.nextElementSibling)
    return null
  else
    return next_measure(m.nextElementSibling)
}

// Note coordinates are off center by a bit
export function note_coords(note) {
  // Computes useful coordinates of a note
  return [note.getElementsByClassName('notehead')[0].getBBox().x + 100, note.getElementsByClassName('notehead')[0].getBBox().y]
}

// Gets all elements from the doc with the oldid
export function get_by_oldid(doc, id) {
  if (!id)
    return null
  if (id[0] == '#') { id = id.slice(1) }
  var elems = doc.querySelectorAll('[*|oldid=\'' + id + '\']')
  if (elems) {
    return Array.from(elems)
  } else {
    return Array.from(doc.all).find((x) => { return x.getAttribute('oldid') == id })
  }
}

// From id string to element, looking in the document doc
export function get_by_id(doc, id) {
  if (!id)
    return null
  if (id[0] == '#') { id = id.slice(1) }
  var elem = doc.querySelector('[*|id=\'' + id + '\']')
  if (elem) {
    return elem
  } else {
    return Array.from(doc.getElementsByTagName('*')).find((x) => { return x.getAttribute('id') == id || x.getAttribute('xml:id') == id })
  }
}

// Simple utility to get oldid if available.
export const id_or_oldid = elem => {
  let ret = elem.getAttribute('oldid') ?? elem.id
  return ret.slice(ret.search(/[^\d]/))
}

// More complex utility to fully search until we find the "basic" ID, in
// either the MEI or the document.
// Takes an element, gives an ID string
export function get_raw_id(elem) {
  if (!elem)
    return

  let ret

  if (document.contains(elem)) {
    //
    // SVG traversal
    if (!elem.hasAttribute('oldid'))
      ret = elem.id
    if (!ret || typeof ret == 'undefined')
      ret = get_id(document.getElementById(elem.getAttribute('oldid')))

  } else if (elem.hasAttribute('xml:id')) {

    // MEI traversal
    if (elem.hasAttribute('sameas'))
      ret = get_id(get_by_id(mei, elem.getAttribute('sameas')))
    else if (elem.hasAttribute('corresp'))
      ret = get_id(get_by_id(mei, elem.getAttribute('corresp')))
    else if (elem.hasAttribute('copyof'))
      ret = get_id(get_by_id(mei, elem.getAttribute('copyof')))
    else if (elem.hasAttribute('xml:id'))
      ret = elem.getAttribute('xml:id')

  }

  return ret
}

export function get_id(elem) {
  let ret = get_raw_id(elem)
  return ret ? ret.slice(ret.search(/[^\d]/)) : ret
}

export function id_in_svg(draw_context, id) {
  if (!id)
    return undefined
  // Computes the relevant ID string for the element in the draw
  // context that correlates to the given ID string
  if (id[0] == '#') { id = id.slice(1) }
  if (id.slice(0, 3) == 'gn-') { id = id.slice(3) }
  // use the layer.id_mapping to find the things in the layer score (if
  // that's how it is), then dc.id_prefix to calculate the final id
  var layer_id = id_in_layer(draw_context.layer, id)
  var svg_note = document.getElementById(layer_id)
  if (draw_context.svg_elem.contains(svg_note))
    return layer_id
  if (layer_id)
    return draw_context.id_prefix + layer_id
}

export function id_in_layer(layer_context, id) {
  // Computes the relevant ID string for the element in the layer
  // context that correlates to the given ID string
  if (id[0] == '#') { id = id.slice(1) }
  // use the layer.id_mapping to find the thing, if it exists
  var pair = layer_context.id_mapping.find((p) => p[1] == id)
  if (pair)
    return pair[0]
  else // This is probably a relation that has no real 'layer' as such
    return id
}

// From graph node to list of all arcs that refer to it
export function node_referred_to(id) {
  console.debug('Using global: mei to find element')
  if (!id) return
  return Array.from(mei.getElementsByTagName('arc'))
    .filter((x) => {
      return (x.getAttribute('from') == '#' + id.slice(1) ||
        x.getAttribute('to') == '#' + id.slice(1))
    }).length > 0
}

// From MEI graph node to the ID string for its referred note.
export function node_to_note_id(note) {
  if (!note) return
  if (note.getElementsByTagName('label')[0].children.length == 0)
    return note.getAttribute('xml:id')
  return note.getElementsByTagName('label')[0].
    getElementsByTagName('note')[0].
    getAttribute('corresp').replace('#', '')
}

// Always-positive modulo
export function mod(n, m) {
  return ((n % m) + m) % m
}

export function average2(x, y) { return (x + y) / 2 }

// What's the accidentals for the given (SVG or MEI) note?
function note_get_accid(note) {
  console.debug('Using globals: document, mei to find element')
  if (document.contains(note))
    note = get_by_id(mei, get_raw_id(note))
  if (note.hasAttribute('accid.ges'))
    return note.getAttribute('accid.ges')
  if (note.hasAttribute('accid'))
    return note.getAttribute('accid')
  if (note.children.length == 0)
    return ''
  var accids = note.getElementsByTagName('accid')
  if (accids.length == 0)
    return ''
  var accid = accids[0] // We don't care if there's more than one.
  if (accid.hasAttribute('accid.ges'))
    return accid.getAttribute('accid.ges')
  if (accid.hasAttribute('accid'))
    return accid.getAttribute('accid')
  return ''
}

// From any relation element to list of MEI note elements
export function relation_get_notes(he) {
  var mei_graph = getMeiGraph()
  he = get_by_id(mei, get_id(he))
  var note_nodes = relation_allnodes(mei_graph, he)
  var notes = note_nodes.map(node_to_note_id).map((n) => get_by_id(mei, n))
  return notes

}
// From any relation element to list of MEI note elements
export function relation_get_notes_separated(he) {
  var mei_graph = getMeiGraph()
  he = get_by_id(mei, get_id(he))
  var prim_nodes = relation_primaries(mei_graph, he)
  var prims = prim_nodes.map(node_to_note_id).map((n) => get_by_id(mei, n))
  var sec_nodes = relation_secondaries(mei_graph, he)
  var secs = sec_nodes.map(node_to_note_id).map((n) => get_by_id(mei, n))
  return [prims, secs]
}

// Get the MEI-graph nodes that are adjacent to a relation
export function relation_allnodes(mei_graph, he) {
  var arcs_array = Array.from(mei_graph.getElementsByTagName('arc'))
  var nodes = []
  arcs_array.forEach((a) => {
    if (a.getAttribute('from') == '#' + he.getAttribute('xml:id')) {
      nodes.push(get_by_id(mei_graph.getRootNode(), a.getAttribute('to')))
    }
  })
  return nodes
}

// Get the MEI-graph nodes that are adjacent and primary to a relation
export function relation_primaries(mei_graph, he) {
  var arcs_array = Array.from(mei_graph.getElementsByTagName('arc'))
  var nodes = []
  arcs_array.forEach((a) => {
    if (a.getAttribute('from') == '#' + he.getAttribute('xml:id') &&
      a.getAttribute('type') == 'primary') {
      nodes.push(get_by_id(mei_graph.getRootNode(), a.getAttribute('to')))
    }
  })
  return nodes
}
// Get the MEI-graph nodes that are adjacent and secondary to a relation
export function relation_secondaries(mei_graph, he) {
  if (!he) return
  var arcs_array = Array.from(mei_graph.getElementsByTagName('arc'))
  var nodes = []
  arcs_array.forEach((a) => {
    if (a.getAttribute('from') == '#' + he.getAttribute('xml:id') &&
      a.getAttribute('type') == 'secondary') {
      nodes.push(get_by_id(mei_graph.getRootNode(), a.getAttribute('to')))
    }
  })
  return nodes
}

// Get te type string of the MEI relation node
export function relation_type(he) {
  // TODO: Sanity checks
  if (he.children.length == 0) {
    return ''
  } else {
    return he.children[0].getAttribute('type')
  }
}

// Set up new graph node for a note
export function add_mei_node_for(mei_graph, note) {
  var svg_id = get_raw_id(note)
  var id = get_id(get_by_id(mei, svg_id))
  var elem = get_by_id(mei_graph.getRootNode(), 'gn-' + id)
  if (elem != null) {
    return elem
  }
  elem = mei_graph.getRootNode().createElementNS('http://www.music-encoding.org/ns/mei', 'node')
  // This node represent that note
  var label = mei_graph.getRootNode().createElementNS('http://www.music-encoding.org/ns/mei', 'label')
  var note = mei_graph.getRootNode().createElementNS('http://www.music-encoding.org/ns/mei', 'note')
  note.setAttribute('corresp', '#' + id)
  elem.appendChild(label)
  label.appendChild(note)
  // But should have a separate XML ID
  elem.setAttribute('xml:id', 'gn-' + id)
  mei_graph.appendChild(elem)
  return elem
}

// Find graphical element corresponding to an MEI graph node and hide it
export function hide_note(draw_context, note) {
  var elem = get_by_id(draw_context.svg_elem.getRootNode(), id_in_svg(draw_context, node_to_note_id(note)))
  if (elem && draw_context.svg_elem.contains(elem))
    elem.classList.add('hidden-reduced')
  return elem
}

// Find graphical element corresponding to an MEI graph node and hide it
export function hide_note_hier(draw_context, note) {
  var elem = get_by_id(draw_context.svg_elem.getRootNode(), 'hier' + id_in_svg(draw_context, node_to_note_id(note)))
  if (elem && draw_context.svg_elem.contains(elem))
    elem.classList.add('hidden-reduced')
  return elem
}

// Find graphical element corresponding to an MEI graph node and hide it
export function hide_he(draw_context, he) {
  var elem = get_by_id(draw_context.svg_elem.getRootNode(), draw_context.id_prefix + he.getAttribute('xml:id'))
  if (elem && draw_context.svg_elem.contains(elem))
    elem.classList.add('hidden-reduced')
  return elem
}

// Find graphical element corresponding to an MEI graph node and hide it
export function hide_he_hier(draw_context, he) {
  var elem = get_by_id(draw_context.svg_elem.getRootNode(), 'hier' + draw_context.id_prefix + he.getAttribute('xml:id'))
  if (elem && draw_context.svg_elem.contains(elem))
    elem.classList.add('hidden-reduced')
  return elem
}

// Secondaries are greyed out
function mark_secondary(item) {
  if (!item) {
    console.log('Not a note')
    return
  }
  if (item.classList.contains('secondarynote')) {
    var level = getComputedStyle(item).getPropertyValue('--how-secondary')
    item.style.setProperty('--how-secondary', level * 2)
  } else {
    item.classList.add('secondarynote')
    item.style.setProperty('--how-secondary', 2)
  }
}

// No longer as much of a secondary
function unmark_secondary(item) {
  if (!item) {
    console.log('Not a note')
    return
  }
  var level = getComputedStyle(item).getPropertyValue('--how-secondary')
  item.style.setProperty('--how-secondary', level / 2)
  if (level / 2 == 1)
    item.classList.remove('secondarynote')
}

// For a certain MEI relation node, find its secondaries and mark them as
// secondary in the draw context
export function mark_secondaries(draw_context, mei_graph, he) {
  if (he.tagName != 'node') // TODO: Probably bad, but shouldn't happen from do_relation
    he = get_by_id(mei_graph.getRootNode(), he.id)
  var secondaries = relation_secondaries(mei_graph, he)
  secondaries.forEach((n) => {
    var svg_note = document.getElementById(id_in_svg(draw_context, node_to_note_id(n)))
    mark_secondary(svg_note)
  })
}

// For a certain MEI relation node, find its secondaries and unmark them as
// secondary in the draw context
export function unmark_secondaries(draw_context, mei_graph, he) {
  if (he.tagName != 'node')
    he = get_by_id(mei_graph.getRootNode(), he.id)
  var secondaries = relation_secondaries(mei_graph, he)
  secondaries.forEach((n) => {
    var svg_note = document.getElementById(id_in_svg(draw_context, node_to_note_id(n)))
    unmark_secondary(svg_note)
  })
}

// Find the measure this MEI score element occurs in
function get_measure(elem) { if (elem.tagName == 'measure') return elem; else return get_measure(elem.parentElement) }

// Get the Interesting class from a classlist
export function get_class_from_classlist(elem) {
  if (typeof (elem) == 'undefined') {
    return false
  }

  // TODO: If more things can be selected etc., it should be reflected here
  if (elem.classList.contains('note'))
    return 'note'
  if (elem.classList.contains('relation'))
    return 'relation'
  if (elem.classList.contains('metarelation'))
    return 'metarelation'

  return ''
}

// Get the center of the bounding box
function getBoundingBoxCenter(elem) {
  // use the native SVG interface to get the bounding box
  var bbox = elem.getBBox()
  // return the center of the bounding box
  return [bbox.x + bbox.width / 2, bbox.y + bbox.height / 2]
}

// Get the correct coordinates for where to aim the metarelation
export function get_metarelation_target(elem) {
  if (elem.classList.contains('metarelation')) {
    var circ = elem.getElementsByTagName('circle')[0]
    return [circ.cx.baseVal.value, circ.cy.baseVal.value]
  } else if (elem.classList.contains('relation')) {
    return getBoundingBoxCenter(elem)
  } else {
    console.log('wtf')
    console.log(elem)
    return [0, 0]
  }
}

// Average over a list of values
export function average(l) { return l.reduce((a, b) => a + b, 0) / l.length }

export function note_to_text(id) {
  var mei_elem = get_by_id(mei, id)
  if (mei_elem.tagName == 'node')
    return mei_elem.children[0].getAttribute('type')
  var accid = note_get_accid(mei_elem)
  accid = accid.replace(/s/g, '#')
  accid = accid.replace(/f/g, 'b')
  accid = accid.replace(/n/g, '')
  return mei_elem.getAttribute('pname') + accid + mei_elem.getAttribute('oct')
}

// Compute a text to represent notes
export function to_text(elems) {
  // TODO: Detect and warn for selections spanning several drawing contexts
  if (elems.length == 0)
    return ''
  if (elems[0].classList.contains('note')) {
    elems.sort((n, m) => {
      const [nx, ny] = note_coords(n)
      const [mx, my] = note_coords(m)
      return (nx - mx == 0) ? my - ny : nx - mx
    })
    return elems.map(note => note_to_text(get_raw_id(note)))
  }
}

// Translate deprecated names
export function fix_synonyms(mei) {
  Array.from(mei.getElementsByTagName('node')).forEach((elem) => {
    if (elem.getAttribute('type') == 'hyperedge')
      elem.setAttribute('type', 'relation')
    if (elem.getAttribute('type') == 'metaedge')
      elem.setAttribute('type', 'metarelation')
  })
  return mei
}

// sameas/copyof for layers and graphs is deprecated, all should be corresp
export function fix_corresp(mei_elem) {
  Array.from(mei_elem.children).forEach(fix_corresp) // recurse
  let attr = mei_elem.hasAttribute('sameas') ? 'sameas' :
    mei_elem.hasAttribute('copyof') ? 'copyof' : ''
  if (attr) {
    if (mei_elem.closest('graph') || mei_elem.closest('eTree')) {
      // We're in the analysis, any sameas/copyof should be a corresp
      mei_elem.setAttribute('corresp', mei_elem.getAttribute(attr))
      mei_elem.removeAttribute(attr)
    } else {
      // We're in a score
      let target = get_by_id(mei, mei_elem.getAttribute(attr))
      if (target.closest('score') != mei_elem.closest('score')) {
        // TODO: Bump this check another level up (to <mdiv>) once the change
        // goes through that that's where layers live
        // We're referring outside the score, this is probably another layer
        mei_elem.setAttribute('corresp', mei_elem.getAttribute(attr))
        mei_elem.removeAttribute(attr)
      }
    }
    // Probably a legit use of sameas/copyof
  }
}

/**
 * Creates and ID that validate a predicate
 *
 * @param {string => boolean} predicate Predicate for the ID to be valid
 *
 * @return {string} The generated ID
 */
function create_and_check_id(predicate) {
  let id

  do {
    id = random_id()
  } while (!predicate(id))

  return id
}

export function fix_layers(mei) {
  // Find all mdivs
  // If they have more than one score among its children (i.e. the app did it)
  // For each score
  // Create a new mdiv for the score and move it
  Array.from(mei.getElementsByTagName('mdiv')).forEach((mdiv_elem) => {

    let prefix_re = /l(\d+)-.*/
    let sliced_re = /-sliced$/

    // Add an ID to mdiv if none
    let mdiv_id = mdiv_elem.getAttribute('xml:id')
    if (!mdiv_id) {
      mdiv_id = create_and_check_id(id =>
        !getDrawContexts().find(x =>
          x.mei_mdiv.getAttribute('xml:id') == id
        )
      )
      mdiv_elem.setAttribute('xml:id', mdiv_id)
    }

    let scs = Array.from(mdiv_elem.children).filter((elem) => elem.tagName == 'score')
    if (scs.length > 1) {
      for (let scix in scs) {
        if (scix == 0)
          continue
        let score_elem = scs[scix]

        // Add an ID to score if none
        let score_id = score_elem.getAttribute('xml:id')
        if (!score_id) {
          score_id = create_and_check_id(id =>
            !getDrawContexts().find(x =>
              x.mei_score.getAttribute('xml:id') == id
            )
          )
          score_elem.setAttribute('xml:id', score_id)
        }

        if (prefix_re.test(score_id)) {
          // We almost certainly have a layer thingy
          let score_prefix = prefix_re.exec(score_id)[1]
          var new_mdiv_elem = mei.createElementNS('http://www.music-encoding.org/ns/mei', 'mdiv')
          if (sliced_re.test(score_id))
            new_mdiv_elem.setAttribute('xml:id', score_prefix + '-' + mdiv_id + '-sliced')
          else
            new_mdiv_elem.setAttribute('xml:id', score_prefix + '-' + mdiv_id)
          mdiv_elem.parentElement.append(new_mdiv_elem)
          new_mdiv_elem.append(score_elem)
        }
      }
    } else {
      // Add an ID to score if none
      let score_id = scs[0].getAttribute('xml:id')
      if (!score_id) {
        score_id = create_and_check_id(id =>
          !getDrawContexts().find(x => {
            if (!x.mei_score) return
            return x.mei_score.getAttribute('xml:id') == id
          })
        )
        scs[0].setAttribute('xml:id', score_id)
      }
    }
  })
}

var attributes = ['dur',
  'n',
  'dots',
  'when',
  'layer',
  'staff',
  'tstamp.ges',
  'tstamp.real',
  'tstamp',
  'loc',
  'dur.ges',
  'dots.ges',
  'dur.metrical',
  'dur.ppq',
  'dur.real',
  'dur.recip',
  'beam',
  'fermata',
  'tuplet']

// Make a rest of the same properties as the given note.
export function note_to_rest(mei, note) {
  var rest = mei.createElementNS('http://www.music-encoding.org/ns/mei', 'rest')
  rest.setAttribute('xml:id', 'rest-' + note.getAttribute('xml:id'))
  for (let a of attributes)
    if (note.hasAttribute(a))
      rest.setAttribute(a, note.getAttribute(a))
  return rest
}
// Make a space of the same properties as the given note.
export function note_to_space(mei, note) {
  var space = mei.createElementNS('http://www.music-encoding.org/ns/mei', 'space')
  space.setAttribute('xml:id', 'space-' + note.getAttribute('xml:id'))
  for (let a of attributes)
    if (note.hasAttribute(a))
      space.setAttribute(a, note.getAttribute(a))
  return space
}
// Make a chord of the same properties as the given note.
export function note_to_chord(mei, note) {
  var chord = mei.createElementNS('http://www.music-encoding.org/ns/mei', 'chord')
  chord.setAttribute('xml:id', 'chord-' + note.getAttribute('xml:id'))
  for (const a of attributes)
    if (note.hasAttribute(a))
      chord.setAttribute(a, note.getAttribute(a))
  return chord
}

export function chord_to_space(mei, chord) {
  var space = mei.createElementNS('http://www.music-encoding.org/ns/mei', 'space')
  space.setAttribute('xml:id', 'space-' + chord.getAttribute('xml:id'))
  for (let a of attributes)
    if (chord.hasAttribute(a))
      space.setAttribute(a, chord.getAttribute(a))
  return space
}

// Traverse the XML tree and add on a prefix to the start of each ID. If
// it's an SVG, we also save the old id in the oldid attribute
export function prefix_ids(elem, prefix) {
  if (elem.id) {
    // SVG modification
    elem.setAttribute('oldid', elem.id)
    elem.id = prefix + elem.id
  }
  if (elem.getAttribute('xml:id')) {
    // MEI modification
    // No need to set oldid - we have already made links using
    // corresp
    elem.setAttribute('xml:id', prefix + elem.getAttribute('xml:id'))
  }
  if (elem.getAttribute('startid'))
    elem.setAttribute('startid', prefix + elem.getAttribute('startid'))
  if (elem.getAttribute('endid'))
    elem.setAttribute('endid', prefix + elem.getAttribute('endid'))
  Array.from(elem.children).forEach((e) => prefix_ids(e, prefix))
}

// Clone an MEI into a new XMLDocument
export function clone_mei(mei) {
  var new_mei = mei.implementation.createDocument(
    mei.namespaceURI, // namespace to use
    null, // name of the root element (or for empty document)
    null // doctype (null for XML)
  )
  var newNode = new_mei.importNode(
    mei.documentElement, // node to import
    true // clone its descendants
  )
  new_mei.appendChild(newNode)
  return new_mei
}

// Recursively compute a mapping between element IDs and their
// corresponding get_id strings, i.e. what the element represents
export function get_id_pairs(elem) {
  var item
  if (elem.id)
    item = [elem.id, get_id(elem)]
  else if (elem.hasAttribute('xml:id'))
    item = [elem.getAttribute('xml:id'), get_id(elem)]
  if (item)
    return [item].concat(Array.from(elem.children).flatMap(get_id_pairs))
  else
    return Array.from(elem.children).flatMap(get_id_pairs)
}

export function new_layer_element() {
  var layers_element = document.getElementById('layers')
  var id = layers_element.children.length

  var new_layer = document.createElement('div')
  new_layer.id = 'layer' + id
  new_layer.classList.add('layer')
  new_layer.classList.add('layer-new-ui')

  layers_element.appendChild(new_layer)

  return new_layer
}

export function new_view_elements(layer_element) {
  var draw_contexts = getDrawContexts()
  var new_view = document.createElement('div')
  new_view.id = 'view' + draw_contexts.length
  new_view.classList.add('view')
  var new_svg = document.createElement('div')
  new_svg.id = 'svg' + draw_contexts.length
  new_svg.classList.add('svg_container')
  new_view.appendChild(new_svg)
  layer_element.appendChild(new_view)
  return [new_view, new_svg]
}

export function checkbox(value) {
  var checkbox = document.createElement('input')
  checkbox.setAttribute('type', 'checkbox')
  checkbox.setAttribute('value', value)
  return checkbox
}

export function button(value) {
  var button = document.createElement('input')
  button.setAttribute('type', 'button')
  button.setAttribute('value', value)
  return button
}

export function sanitize_xml(xml) {

  var sanitized_xml = xml

  strip_xml_tags.forEach(tag => {
    Array.from(xml.getElementsByTagName(tag)).forEach(e => {
      e.parentNode.removeChild(e)
    })
  })

  strip_mei_tags.forEach(tag => {
    Array.from(xml.getElementsByTagName(tag)).forEach(e => {
      e.parentNode.removeChild(e)
    })
  })

  return sanitized_xml
}

export function prune_mei_graph(mei) {
  // TODO: Ideally render this kludge of a function unnecessary by eliminating the numerous undo/redo bugs that leave ghost elements behind.
  let removedArcs = 0
  let removedNodes = 0

  try {
    // All all existing node id's to a map
    const nodes = mei.querySelectorAll('node')
    const existingNodeIds = new Set()

    nodes.forEach(node => {
      const id = node.getAttribute('xml:id')
      if (id) existingNodeIds.add(id)
    })

    // Helper to strip leading hashtag if present (though in practice it should be present)
    const strip = (val) => (val && val.startsWith('#') ? val.slice(1) : val)

    // Remove "broken" arcs (i.e. arcs with `from` or `to` references to nonexistent node)
    const arcs = mei.querySelectorAll('arc')
    arcs.forEach(arc => {
      try {
        const fromRaw = arc.getAttribute('from')
        const toRaw = arc.getAttribute('to')

        const fromId = strip(fromRaw)
        const toId = strip(toRaw)

        if (!fromId || !toId || !existingNodeIds.has(fromId) || !existingNodeIds.has(toId)) {
          arc.remove()
          removedArcs++
        }
      } catch (e) {
        console.warn('Export: Skipping arc element with broken reference.', e)
      }
    })

    // Remove note or relation nodes that are not referenced in any arc.
    const remainingArcs = mei.querySelectorAll('arc')
    const referencedNodeIds = new Set()

    remainingArcs.forEach(arc => {
      try {
        const f = strip(arc.getAttribute('from'))
        const t = strip(arc.getAttribute('to'))
        if (f) referencedNodeIds.add(f)
        if (t) referencedNodeIds.add(t)
      } catch (e) {
        console.warn('Export: Skipping potentially arc element during reference collection. This is probably a bug, not a sign of data corruption.', e)
      }
    })

    nodes.forEach(node => {
      try {
        const id = node.getAttribute('xml:id')
        if (!referencedNodeIds.has(id)) {
          node.remove()
          removedNodes++
        }
      } catch (e) {
        console.warn('Export: Skipping potentially corrupt node element.', e)
      }
    })

    // Remove duplicate arc elements.
    const visited = new Map()
    const duplicates = []

    for (const arc of remainingArcs) {
      const from = arc.getAttribute('from') || ''
      const to = arc.getAttribute('to') || ''
      const type = arc.getAttribute('type') || ''

      const key = `${from}|${to}|${type}`

      if (visited.has(key)) {
        duplicates.push({
          arc: arc,
          from: from,
          to: to,
          type: type,
          firstOccurrence: visited.get(key)
        })
      } else {
        // First time seeing this combination
        visited.set(key, arc)
      }
    }
    removedArcs = removedArcs + duplicates.length
    // Delete all duplicates
    duplicates.forEach(dup => dup.arc.remove())

    console.log(`Pruning graph: ${removedArcs} arcs pruned away.`)
    console.log(`Pruning graph: ${removedNodes} nodes pruned away.`)

    return mei
  } catch (error) {
    alert('Since the pruning process encountered errors, the exported MEI file may be corrupt.')
    console.error('Pruning error context:', error)
    return mei
  }
}

export function check_for_duplicate_relations(type, prospective_primaries, prospective_secondaries) {
  var mei_graph = getMeiGraph()

  var primaries = prospective_primaries
    .map(p => p.getAttribute('id').replace(/(^\d+-?)/, 'gn-'))
    .sort((a, b) => a < b)
  var secondaries = prospective_secondaries
    .map(p => p.getAttribute('id').replace(/(^\d+-?)/, 'gn-'))
    .sort((a, b) => a < b)

  var same_type_relations = Array
    .from(mei_graph.querySelectorAll('[type=\'relation\']'))
    .filter(n => n.children[0].getAttribute('type') == type)

  same_type_relations.forEach(r => {
    var p_s = relation_get_notes_separated(r)
    var p = p_s[0]
    var s = p_s[1]

    if (!p || !p[0] || !s || !s[0]) return

    p = p.map(i => i.getAttribute('xml:id'))
      .sort((a, b) => a < b)
    s = s.map(i => i.getAttribute('xml:id'))
      .sort((a, b) => a < b)
    if (JSON.stringify(primaries) == JSON.stringify(p)
      && JSON.stringify(secondaries) == JSON.stringify(s)) {
      alert('Warning: This relation already exists.\nCreating a duplicate anyway.')
      return false
    }
  })
  return true
}

export function draw_context_of(elem) {
  return getDrawContexts().find(dc => dc.svg_elem.contains(elem))
}

// Count how many slurs are connected to a note element
function count_existing_slurs(noteElement) {
  const drawContext = draw_context_of(noteElement)
  if (!drawContext) return 0

  const relations = Array.from(drawContext.svg_elem.getElementsByClassName('relation'))

  let count = 0
  relations.forEach(relation => {
    const slurs = Array.from(relation.getElementsByTagName('path'))
    slurs.forEach(slur => {
      if (slur.getAttribute('start-note') === noteElement.id ||
        slur.getAttribute('end-note') === noteElement.id) {
        count++
      }
    })
  })
  return count
}

// Draw a slur between two notes
export function draw_slur(startNote, endNote, isDownward) {
  const newElement = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  var draw_contexts = getDrawContexts()
  const curvature_factor = draw_contexts.curvatureFactor || .5
  const stroke_width = 20 + curvature_factor * 50

  // Get base coordinates
  const start = note_coords(startNote)
  const end = note_coords(endNote)

  // Calculate offsets based on existing slurs
  const nStartSlur = count_existing_slurs(startNote)
  const nEndSlur = count_existing_slurs(endNote)

  // Apply offsets
  const adjustedStart = [start[0], start[1]]
  const adjustedEnd = [end[0], end[1]]

  // Calculate base height and additional height for existing slurs
  const slurOffsetHeightUnit = 150 + stroke_width * 2
  const maxExistingSlurs = Math.max(nStartSlur, nEndSlur)
  const additionalHeight = maxExistingSlurs * slurOffsetHeightUnit
  const width = Math.abs(adjustedEnd[0] - adjustedStart[0])

  let pathData

  // Calculate two control points on axes that are perpendicular to the linear segment between the start and end of the slur,
  // and intersect that segment at 20% and 80% of its length, so that the four points together form a trapezoid.
  const cpMult = isDownward ? 1 : -1
  const cpScaler = 4 * curvature_factor / Math.log(width) + additionalHeight / 5000
  const cp1x = Math.max((4 * adjustedStart[0] + adjustedEnd[0]) / 5 - cpMult * cpScaler * (adjustedEnd[1] - adjustedStart[1]), adjustedStart[0] + 100)
  const cp2x = Math.max((adjustedStart[0] + 4 * adjustedEnd[0]) / 5 - cpMult * cpScaler * (adjustedEnd[1] - adjustedStart[1]), adjustedStart[0] + 100)
  const cp1y = (4 * adjustedStart[1] + adjustedEnd[1]) / 5 + cpMult * cpScaler * (adjustedEnd[0] - adjustedStart[0])
  const cp2y = (adjustedStart[1] + 4 * adjustedEnd[1]) / 5 + cpMult * cpScaler * (adjustedEnd[0] - adjustedStart[0])

  const topCP1 = [cp1x, cp1y]
  const topCP2 = [cp2x, cp2y]
  const bottomCP1 = topCP1
  const bottomCP2 = topCP2

  pathData = `
    M ${adjustedStart[0]},${adjustedStart[1]}
    C ${topCP1[0]},${topCP1[1]} ${topCP2[0]},${topCP2[1]} ${adjustedEnd[0]},${adjustedEnd[1]}
    L ${adjustedEnd[0]},${adjustedEnd[1]}
    C ${bottomCP2[0]},${bottomCP2[1]} ${bottomCP1[0]},${bottomCP1[1]} ${adjustedStart[0]},${adjustedStart[1]}
    Z`
  // }

  newElement.setAttribute('d', pathData)
  newElement.setAttribute('style', `stroke-width:${stroke_width}`)
  return newElement
}

export function isSlurDownward(svg_elem, startNote, endNote) {
  let system_bbox = svg_elem.querySelector('.system').getBBox()
  let system_mid = system_bbox.y + system_bbox.height / 2
  return system_mid < note_coords(startNote)[1] && system_mid < note_coords(endNote)[1]
}

export function scrollThroughRelations() {
  var elem = document.elementFromPoint(getMouseX(), getMouseY())

  if (elem.tagName != 'g') elem = elem.closest('g')
  if (!elem) return
  flip_to_bg(elem)
  if (elem.onmouseout) elem.onmouseout()

  var elem = document.elementFromPoint(getMouseX(), getMouseY())
  if (elem.tagName != 'g') elem = elem.closest('g')
  if (elem.onmouseover) elem.onmouseover()
  document.dispatchEvent(
    new CustomEvent('fliprelation', {
      detail: {
        target: elem,
      },
    })
  )
}

export function handleFlip(e) {
  e.preventDefault()
  scrollThroughRelations()
}

/**
 * Get the onset of a note node.
 */
function getNodeOnsets(mei) {
  let onsets = {}
  const note_elements = Array.from(mei.getElementsByTagName('node')).filter(n => n.getAttribute('type') == '' || n.getAttribute('type') == null)
  if (note_elements.length > 0) {
    note_elements.forEach(n => onsets[n.getAttribute('xml:id')] = document.querySelector('svg #' + n.getAttribute('xml:id').slice(3)).dataset.onset)
    return onsets
  } else {
    return null
  }
}

export function pitchTimeGraph(mei) {
  const arcs = Array.from(mei.getElementsByTagName('arc'))
  const note_onsets = getNodeOnsets(mei)
  console.log('Obtaining onset array...')
  console.log(note_onsets)

  const edges = []

  // Gather arcs from a relation to a note
  const validArcs = arcs.filter(arc => {
    let fromId = arc.getAttribute('from')
    let toId = arc.getAttribute('to')
    let fromEl = get_by_id(mei, fromId.replace('#', ''))
    let toEl = get_by_id(mei, toId.replace('#', ''))
    return (fromEl.getAttribute('type') == 'relation' && (toEl.getAttribute('type') == '' || toEl.getAttribute('type') == null))
  })

  // Group these arcs by relation id
  const relations = {}
  validArcs.forEach(arc => {
    let fromId = arc.getAttribute('from').slice(1)
    if (!relations[fromId]) relations[fromId] = []
    relations[fromId].push(arc)
  })

  // Convert each relation
  for (const relId in relations) {
    const relation = relations[relId]

    relation.sort((a, b) => note_onsets[a.getAttribute('to')] - note_onsets[b.getAttribute('to')])

    for (let i = 0; i < relation.length - 1; i++) {
      const arc1 = relation[i]
      const arc2 = relation[i + 1]

      const n1Id = arc1.getAttribute('to').slice(1)
      const n2Id = arc2.getAttribute('to').slice(1)

      // Calculate direction value (+1 or -1) based on onset
      const getDirection = (sourceId, targetId) =>
        note_onsets[targetId] >= note_onsets[sourceId] ? 1 : -1

      const isP1 = arc1.getAttribute('type') === 'primary'
      const isS1 = arc1.getAttribute('type') === 'secondary'
      const isP2 = arc2.getAttribute('type') === 'primary'
      const isS2 = arc2.getAttribute('type') === 'secondary'

      const n1 = get_by_id(mei, n1Id)
      const n2 = get_by_id(mei, n2Id)
      if (isP1 && isS2) {
        edges.push({ from: n1, to: n2, direction: getDirection(n1Id, n2Id), type: 'p-s' })
      } else if (isS1 && isP2) {
        edges.push({ from: n2, to: n1, direction: getDirection(n2Id, n1Id), type: 's-p' })
        alert('Graph inconsistency: Cannot convert to pitch-time graph.')
      } else {
        edges.push({ from: n1, to: n2, direction: getDirection(n1Id, n2Id), type: isS1 ? 's-s' : 'p-p' })
        edges.push({ from: n2, to: n1, direction: getDirection(n2Id, n1Id), type: isS1 ? 's-s' : 'p-p' })
      }
    }
  }

  return edges
}

function in_edges(graph, node) {
  return graph.filter(edge => edge.to === node)
}

/**
 * Returns a list of all node elements one directed edge away from the given node.
 */
function neighbors(graph, node) {
  return graph
    .filter(edge => edge.from === node)
    .map(edge => edge.to)
}

/**
 * Yannis's extension to topological sort ported from his Python code.
 * Returns {[Array, boolean]} [sortedNodes, updatesOccurred].
 */
export function topologicalSort(graph) {

  // Housekeeping preliminaries.
  const nodeSet = new Set()
  graph.forEach(edge => {
    nodeSet.add(edge.from)
    nodeSet.add(edge.to)
  })

  const allNodes = Array.from(nodeSet) // First reset the element state, so that the reduction process can be restarted on a clean slate.
  allNodes.forEach(node => {
    delete node.generation
  })

  const removedEdges = new Set()
  const result = []
  const sourceNodes = []

  const getActiveInEdges = (n) => in_edges(graph, n).filter(e => !removedEdges.has(e))

  // Identify initial source nodes (nodes with no active incoming edges).
  allNodes.forEach(node => {
    const predecessors = getActiveInEdges(node)
    if (predecessors.length === 0) {
      node.generation = 0
      sourceNodes.push(node)
    }
  })

  let updates = false

  // The main Kahn-based loop.
  while (sourceNodes.length !== 0) {
    const n_from = sourceNodes.pop()
    result.push(n_from)

    // Find outgoing edges from this node that haven't been "removed."
    const neighborEdges = graph.filter(e => e.from === n_from && !removedEdges.has(e))

    for (const edge of neighborEdges) {
      const n_to = edge.to
      const oldGen = n_to.generation

      // Logic for generation updates based on edge type
      if (edge.type === 'p-s') {
        if ((n_to.generation ?? -1) <= n_from.generation) {
          n_to.generation = n_from.generation + 1
        }
      } else if (edge.type === 's-s' || edge.type === 'p-p') {
        if (n_from.generation > (n_to.generation ?? -1)) {
          n_to.generation = n_from.generation
        }
      } else if (edge.type === 's-p') {
        throw new Error('Inconsistent graph: secondary-to-primary label does not match actual edge direction.')
      }

      // Check if a change actually occurred
      if (oldGen !== n_to.generation) {
        updates = true
      }

      // Mark the edge, so that it will not be revisited (effectively "removing" it, as in the original Python code).
      removedEdges.add(edge)

      // If n_to now has no active incoming edges, it becomes a source node.
      if (getActiveInEdges(n_to).length === 0) {
        sourceNodes.push(n_to)
      }
    }
  }

  // If edges remain at the end of the traversal, the directed part of the graph has a cycle.
  if (removedEdges.size !== graph.length) {
    alert('Inconsistent graph: the non-trivially directed part of the graph contains cycles.')
  }

  return [result, updates]
}
