import { polygonHull } from 'd3-polygon'
// import fuzzysearch from 'fuzzysearch'

import { getDrawContexts, getMeiGraph, getVerovioToolkit } from './app'
import { strip_xml_tags } from './conf'
import { getCurrentDrawContext, getTooltip, toggle_selected } from './ui'

// Vector operations, taken from
// http://bl.ocks.org/hollasch/f70f1fe7700f092b5a505e3efd1d9232
var vecScale = function (scale, v) {
  // Returns the vector 'v' scaled by 'scale'.
  return [scale * v[0], scale * v[1]]
}

var vecSum = function (pv1, pv2) {
  // Returns the sum of two vectors, or a combination of a point and a
  // vector.
  return [pv1[0] + pv2[0], pv1[1] + pv2[1]]
}

var unitNormal = function (p0, p1) {
  // Returns the unit normal to the line segment from p0 to p1.
  var n = [p0[1] - p1[1], p1[0] - p0[0]]
  var nLength = Math.sqrt(n[0] * n[0] + n[1] * n[1])
  return [n[0] / nLength, n[1] / nLength]
}

// Returns the path for a rounded hull around a single point (a circle).
var roundedHull1 = function (polyPoints, hullPadding) {
  const p1 = [polyPoints[0][0], polyPoints[0][1] - hullPadding]
  const p2 = [polyPoints[0][0], parseInt(polyPoints[0][1]) + parseInt(hullPadding)]

  return `M ${p1} A `
    + [hullPadding, hullPadding, '0,0,0', p2].join(',')
    + ' A '
    + [hullPadding, hullPadding, '0,0,0', p1].join(',')
}

// Returns the path for a rounded hull around two points (a "capsule" shape).
var roundedHull2 = function (polyPoints, hullPadding) {
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
var roundedHullN = function (polyPoints, hullPadding) {

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

  segments = segments.map(function (segment, index) {
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

function getRandomShade(colour) {
  //  Returns a random shade within a specified range
  var letters = '0123456789ABCDEF'
  var shade = '#'
  for (var i = 0; i < 6; i++) {
    if (
      ((colour == 'r' || colour == 'y' || colour == 'm') && i < 2) ||
        ((colour == 'g' || colour == 'y' || colour == 'c') && (i < 4 && i > 1)) ||
        ((colour == 'b' || colour == 'c' || colour == 'm') && i > 3)
    )
      shade += letters[14]// Math.floor(6+Math.random() * 8)];
    else
      shade += letters[5]
  }
  return shade + '88' // Semitransparency
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
 * Send given SVG to the background and refresh the tooltip.
 * Probably could be replaced by cycling CSS `z-index`.
 */
export function flip_to_bg(elem) {
  var tooltip = getTooltip()
  elem.parentElement.prepend(elem)
  tooltip.close()
  tooltip.open()
}

export function add_to_svg_bg(svg_elem, newElement) {
  // Adds newElement in the background of the system element
  var sibling = svg_elem.getElementsByClassName('system')[0]
  var parent = sibling.parentNode
  parent.insertBefore(newElement, sibling)
}

function add_to_svg_fg(svg_elem, newElement) {
  // Adds newElement in the foreground of the system element
  var sibling = svg_elem.getElementsByClassName('system')[0]
  var parent = sibling.parentNode
  parent.appendChild(newElement)
}

export function g() {
  // Creates a new SVG g element
  var newElement = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  return newElement
}

export function random_id(n = 5) {
  return Math.floor(Math.random() * (1 << (n * 4))).toString(16)
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
  return [note.getElementsByTagName('use')[0].x.animVal.value + 100,
    note.getElementsByTagName('use')[0].y.animVal.value]
}

function get_by_oldid_elem(doc, elem) { return get_by_id(doc, get_id(elem)) }

// Gets all elements from the doc with the oldid
export function get_by_oldid(doc, id) {
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
export const id_or_oldid = elem => elem.getAttribute('oldid') ?? elem.id

// More complex utility to fully search until we find the "basic" ID, in
// either the MEI or the document.
// Takes an element, gives an ID string
export function get_id(elem) {
  if (document.contains(elem)) {
    // SVG traversal
    if (!elem.hasAttribute('oldid'))
      return elem.id
    else
      return get_id(document.getElementById(elem.getAttribute('oldid')))
  } else if (elem.hasAttribute('xml:id')) {
    // MEI traversal
    if (elem.hasAttribute('sameas'))
      return get_id(get_by_id(mei, elem.getAttribute('sameas')))
    else if (elem.hasAttribute('corresp'))
      return get_id(get_by_id(mei, elem.getAttribute('corresp')))
    else if (elem.hasAttribute('copyof'))
      return get_id(get_by_id(mei, elem.getAttribute('copyof')))
    else if (elem.hasAttribute('xml:id'))
      return elem.getAttribute('xml:id')
  }
}

export function id_in_svg(draw_context, id) {
  if (!id)
    return undefined
  // Computes the relevant ID string for the element in the draw
  // context that correlates to the given ID string
  if (id[0] == '#') { id = id.slice(1) }
  // use the layer.id_mapping to find the things in the layer score (if
  // that's how it is), then dc.id_prefix to calculate the final id
  var layer_id = id_in_layer(draw_context.layer, id)
  var svg_note = document.getElementById(layer_id)
  if (draw_context.svg_elem.contains(svg_note))
    return layer_id
  if (layer_id)
    return draw_context.id_prefix + layer_id
}

function id_in_layer(layer_context, id) {
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
function arcs_where_node_referred_to(mei_graph, id) {
  return Array.from(mei_graph.getElementsByTagName('arc'))
    .filter((x) => {
      return (x.getAttribute('from') == '#' + id ||
                x.getAttribute('to') == '#' + id)
    }).length > 0
}

// From graph node to list of all arcs that refer to it
export function node_referred_to(id) {
  console.debug('Using global: mei to find element')
  return Array.from(mei.getElementsByTagName('arc'))
    .filter((x) => {
      return (x.getAttribute('from') == '#' + id ||
                x.getAttribute('to') == '#' + id)
    }).length > 0
}

// From MEI graph node to the note in the layer referring to the same one
function node_to_note_id_layer(layer_context, node) {
  var id = node.getElementsByTagName('label')[0].
    getElementsByTagName('note')[0].
    getAttribute('corresp')
  var pair = layer_context.id_mapping.find((x) => ('#' + x[1]) == id)
  if (pair)
    return pair[0]
  else
    return null
}

// From MEI graph node to and ID string for the note as drawn in the draw context
function node_to_note_id_drawn(draw_context, note) {
  var layer_note = node_to_note_id_layer(draw_context.layer, note)
  if (draw_context.svg_elem.getRootNode().getElementById(layer_note))
    return '#' + layer_note
  else
    return '#' + draw_context.id_prefix + layer_note
}

// From MEI graph node to the ID string for its referred note.
function node_to_note_id_prefix(prefix, note) {
  return note.getElementsByTagName('label')[0].
    getElementsByTagName('note')[0].
    getAttribute('corresp').replace('#', '#' + prefix)
}

// From MEI graph node to the ID string for its referred note.
export function node_to_note_id(note) {
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

// Integer division
function div(n, m) {
  Math.floor(n / m)
}

export function average2(x, y) { return (x + y) / 2 }

// What's the accidentals for the given (SVG or MEI) note?
function note_get_accid(note) {
  console.debug('Using globals: document, mei to find element')
  if (document.contains(note))
    note = get_by_id(mei, get_id(note))
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

// Get the timestamp for a note
function get_time(note) {
  var vrvToolkit = getVerovioToolkit()
  console.debug('Using globals: document, mei to find element')
  if (document.contains(note))
    note = get_by_id(mei, get_id(note))
  return vrvToolkit.getTimeForElement(note.getAttribute('xml:id'))
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
  var svg_id = get_id(note)
  var id = get_id(get_by_id(mei, svg_id))
  var elem = get_by_id(mei_graph.getRootNode(), 'gn-' + id)
  if (elem != null) {
    return elem
  }
  elem = mei_graph.getRootNode().createElement('node')
  // This node represent that note
  var label = mei_graph.getRootNode().createElement('label')
  var note = mei_graph.getRootNode().createElement('note')
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
    elem.classList.add('hidden')
  return elem
}

// Find graphical element corresponding to an MEI graph node and hide it
export function hide_note_hier(draw_context, note) {
  var elem = get_by_id(draw_context.svg_elem.getRootNode(), 'hier' + id_in_svg(draw_context, node_to_note_id(note)))
  if (elem && draw_context.svg_elem.contains(elem))
    elem.classList.add('hidden')
  return elem
}

// Find graphical element corresponding to an MEI graph node and hide it
export function hide_he(draw_context, he) {
  var elem = get_by_id(draw_context.svg_elem.getRootNode(), draw_context.id_prefix + he.getAttribute('xml:id'))
  if (elem && draw_context.svg_elem.contains(elem))
    elem.classList.add('hidden')
  return elem
}

// Find graphical element corresponding to an MEI graph node and hide it
export function hide_he_hier(draw_context, he) {
  var elem = get_by_id(draw_context.svg_elem.getRootNode(), 'hier' + draw_context.id_prefix + he.getAttribute('xml:id'))
  if (elem && draw_context.svg_elem.contains(elem))
    elem.classList.add('hidden')
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
  var svg_elem = draw_context.svg_elem
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
  var svg_elem = draw_context.svg_elem
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

// If we have a single note selected, find all other notes of the same
// pitch in this measure, and select them as secondary, and the previously
// selected one as primary
export function select_samenote() {
  console.debug('Using globals: document, mei to find elems')
  if ((selected.length == 1 || extraselected.length == 1)
   && !(selected.length == 1 && extraselected.length == 1)) {
    var svg_note
    if (selected.length == 1)
      svg_note = selected[0]
    else
      svg_note = extraselected[0]
    var note = get_by_id(mei, svg_note.getAttribute('id'))
    var measure = get_measure(note)
    var candidates = Array.from(measure.getElementsByTagName('note'))
    candidates.forEach((x) => {
      if (
        x.getAttribute('oct') == note.getAttribute('oct') &&
                  x.getAttribute('pname') == note.getAttribute('pname'))
        toggle_selected(get_by_id(document, x.getAttribute('xml:id')))
    })
    // This is an ugly hack
    toggle_selected(svg_note, true)
  }
}

// Deprecated
function svg_find_from_mei_elem(svg_container, id_prefix, e) {
  if (!e)
    return null
  // TODO: Sanity checks
  var id = id_prefix + e.getAttribute('xml:id')
  var svg_e = svg_container.getRootNode().getElementById(id)
  if (svg_e)
    return svg_e
  else {
    id = e.getAttribute('xml:id')
    svg_e = svg_container.getRootNode().getElementById(id)
    if (svg_container.contains(svg_e))
      return svg_e
  }
}

// Get the top coordinate of the bounding box of the given element
function getBoundingBoxTop (elem) {
  // use the native SVG interface to get the bounding box
  var bbox = elem.getBBox()
  // return the center of the bounding box
  return bbox.y + bbox.height
}

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
function getBoundingBoxCenter (elem) {
  // use the native SVG interface to get the bounding box
  var bbox = elem.getBBox()
  // return the center of the bounding box
  return [bbox.x + bbox.width / 2, bbox.y + bbox.height / 2]
}

// "Smart" selection of a coordinate
function getBoundingBoxOffCenter (elem) {
  // use the native SVG interface to get the bounding box
  var bbox = elem.getBBox()
  // return the center of the bounding box
  if (bbox.height > 500) {
    return [bbox.x + bbox.width / 2, bbox.y + 200]
  }
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

// Is this an empty relation?
function is_empty_relation(elem) {
  return relation_get_notes(elem).length == 0
}

// Are we looking a a single note?
function is_note_node(elem) {
  notes = elem.getElementsByTagName('note')
  return elem.tagName == 'node' && notes.length == 1 && notes[0].getAttribute('corresp')
}

// Clean up in the graph to remove empty relations
function remove_empty_relations(graph) {
  Array.from(graph.getElementsByTagName('node')).forEach((elem) => {
    if (!is_note_node(elem) && is_empty_relation(elem)) {
      elem.parentNode.removeChild(elem)
    }
  })
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
    return elems.map(note => note_to_text(get_id(note)))
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
  Array.from(mei_elem.children).forEach(fix_corresp) //recurse
  let attr = mei_elem.hasAttribute('sameas') ? 'sameas' :
             mei_elem.hasAttribute('copyof') ? 'copyof' : ''
  if(attr){
    if(mei_elem.closest('graph') || mei_elem.closest('eTree')){
      // We're in the analysis, any sameas/copyof should be a corresp
      mei_elem.setAttribute('corresp', mei_elem.getAttribute(attr))
      mei_elem.removeAttribute(attr)
    }else{
      // We're in a score
      let target = get_by_id(mei, mei_elem.getAttribute(attr))
      if(target.closest('score') != mei_elem.closest('score')){
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
  var new_layer = document.createElement('div')
  new_layer.id = 'layer' + layers_element.children.length
  new_layer.classList.add('layer')
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

export function indicate_current_context() {
  // Visually indicate the current context. This cannot be done in CSS alone
  // because the relations palette is not a child of .view elements.
  // TODO: Find a more economical solution. This is becoming a hefty `onmousemove`.
  // Note regarding this 👆: could maybe changed on mouseenter of the view. To test: apply `pointer-events: none;` (CSS) on direct children (or on all children) of non-active views, so that mouseenter doesn’t reach children elements of the view.
  var current_draw_context = getCurrentDrawContext()
  if (!(typeof (current_draw_context) == 'undefined')) {

    // Lighten the background of the current context.
    $('.view').removeClass('view--active')
    current_draw_context.view_elem.classList.add('view--active')

    // Mark the sidebar of the current context.
    $('.sidebar').removeClass('sidebar_active')
    current_draw_context.view_elem.children[0].classList.add('sidebar_active')
  }
}

function sanitize_mei(mei) {

  var sanitized_mei = mei

  strip_mei_tags.forEach(tag => {
    Array.from(mei.getElementsByTagName(tag)).forEach(e => {
      e.parentNode.removeChild(e)
    })
  })

  return sanitized_mei
}

export function sanitize_xml(xml) {

  var sanitized_xml = xml

  strip_xml_tags.forEach(tag => {
    Array.from(xml.getElementsByTagName(tag)).forEach(e => {
      e.parentNode.removeChild(e)
    })
  })

  return sanitized_xml
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
  var dc = getDrawContexts().filter((dc) => dc.svg_elem.contains(elem))
  if (dc.length == 0)
    return null
  else
    return dc[0]
}
