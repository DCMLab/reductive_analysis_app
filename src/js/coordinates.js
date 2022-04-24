/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/
import { getUndoActions } from './app'
import { getCurrentDrawContext, getMouseX, getMouseY, getPlacingNote, setPlacingNote, toggle_selected } from './ui'
import { flush_redo } from './undo_redo'
import { average2, get_by_id, get_id, mod, note_coords, note_to_chord, random_id } from './utils'

// The functions in this file are all about converting clicks and mouse
// positions to musically salient information (pitch and time) given a
// Verovio-generated SVG.

var pnames = 'cdefgab'

function getPointerSVGCoords() {
  var current_draw_context = getCurrentDrawContext()
  // Find the system within the current draw context, and compute the local
  // SVG coordinates from its transformation matrix.
  var svg = current_draw_context.svg_elem.children[0]
  var system = current_draw_context.svg_elem.getElementsByClassName('system')[0]
  var pt = svg.createSVGPoint()
  pt.x = getMouseX()
  pt.y = getMouseY()
  return pt.matrixTransform(system.parentElement.getScreenCTM().inverse())
}

export function compute_measure_map(draw_context) {
  // We compute the right edges of each measure so we can easily map into
  // which measure we are through a simple find() later
  let svg = draw_context.svg_elem
  var measures = Array.from(svg.getElementsByClassName('measure'))
  var staves = measures.length ? Array.from(measures[0].getElementsByClassName('staff')) : null // Just look at one measure for now
  var notes = Array.from(svg.getElementsByClassName('note'))
  // We let the right edge of each measure make up the grid lines
  var measure_map = measures.map((msr) => [msr.getBBox().x + msr.getBBox().width, msr])
  measure_map.sort((x, y) => x[0] - y[0])
  return measure_map
  // Maybe replace s.id with the 'n' of the staff in the MEI
}

function coord_measure(dc, pt) {
  // Find the current measure from the precomputed list of right edges
  let r = (dc.measure_map.find((p) => p[0] > pt.x))
  if (r)
    return r[1]
  else
    return undefined
}

function staff_midpoint(staff) {
  // Verovio seems to draw the staff lines as the first five children of
  // the staff element, so we pick the middle line and compute its center
  // to get the center of the whole staff
  let line_rect = staff.children[2]. // Center staff line
    getBBox()
  return line_rect.y + (line_rect.height) / 2
}

function staff_third_distance(staff) {
  // The line between two staff lines is the distance between two notes a
  // third apart.
  let line_rect0 = staff.children[2]. // Center staff line
    getBBox()
  let line_rect1 = staff.children[1]. // Off-center staff line
    getBBox()
  return Math.abs(line_rect0.y - line_rect1.y)
}

function staff_divider(staff1, staff2) {
  // The midpoint between two staves
  let mid1 = staff_midpoint(staff1)
  let mid2 = staff_midpoint(staff2)
  return average2(mid1, mid2)
}

function coord_staff(dc, pt, measure) {
  // For now we don't precompute anything, but instead compute the
  // midpoints of each staff and find the correct one to return by
  // midpoints between midpoints
  var staves = Array.from(measure.getElementsByClassName('staff'))
  var stave_coords = staves.map((s) => [staff_midpoint(s), s])
  stave_coords.sort((a, b) => a[0] - b[0])
  var index_maybe = stave_coords.findIndex((s) => pt.y < s[0])
  if (index_maybe == 0)
    return stave_coords[0][1]
  if (index_maybe == -1)
    return stave_coords[stave_coords.length - 1][1]
  const divider = average2(stave_coords[index_maybe - 1][0],
    stave_coords[index_maybe][0])
  if (pt.y < divider)
    return stave_coords[index_maybe - 1][1]
  else
    return stave_coords[index_maybe][1]
}

function diatonic_note_n(note) {
  // Given an SVG note, what is its signed interval in diatonic steps from C0
  var mei_note = get_by_id(mei, get_id(note))
  var pname = mei_note.getAttribute('pname')
  var oct = mei_note.getAttribute('oct')
  // Assume the above works for now
  return oct * 7 + (pnames.indexOf(pname))
}

export function pitch_grid(staff) {
  // Given a staff and a reference note in that staff, give a function that
  // computes a pitch name and octave for a given y coordinate
  const mid = staff_midpoint(staff)
  const thrd = -Math.abs(staff_third_distance(staff))
  const snd = thrd / 2
  const ns = staff.getElementsByClassName('note')
  var note
  if (ns.length > 0)
    note = ns[0]
  else {
    // No notes in current staff
    const sys = staff.closest('.system')
    // Look through the other staves
    const staves = Array.from(sys.getElementsByClassName('staff'))
    // For something that has the same height as this
    const sibling_staff = staves.find((st) => staff_midpoint(st) == mid &&
	st.getElementsByClassName('note').length > 0)
    // And a note we can compare heights with
    if (sibling_staff)
      note = sibling_staff.getElementsByClassName('note')[0]
  }
  var mid_n
  console.log(note)
  if (!note) {
    // There's no notes to compare with - we need to look at the clef
    const sys = staff.closest('.system')
    // Look through the other staves
    const staves = Array.from(sys.getElementsByClassName('staff'))
    // For something that has the same height as this
    const sibling_staff = staves.find((st) => staff_midpoint(st) == mid &&
	st.getElementsByClassName('clef').length > 0)
    // And a clef we can compare heights with
    const clef = sibling_staff.getElementsByClassName('clef')[0]
    // CLEF Y IS WHAT YOU EXPECT
    const clef_y = clef.children[0].getAttribute('y')
    let clef_n
    switch (clef.children[0].getAttribute('xlink:href')) {
      case 'E062': // Bass clef
        clef_n = 24
        break
      case 'E052': // 8vb treble clef
        clef_n = 25
        break
      case 'E050': // Treble clef
        clef_n = 32
        break
      // TODO: more clefs
    }
    mid_n = clef_n - Math.floor((clef_y - mid) / snd)
  } else {
    // What's the diatonic note number at the middle line of the staff
    mid_n = diatonic_note_n(note) - Math.floor((note_coords(note)[1] - mid) / snd)
  }

  return [(y) => {
    // What's the diatonic note number?
    // TODO: this may need adjustment by snd/2
    var diatonic_n = Math.floor((y + snd / 2 - mid) / snd) + mid_n
    var oct = Math.floor((diatonic_n) / 7)
    var note = pnames[mod(diatonic_n, 7)]

    return [note, oct]
  }, (pname, oct) => {
    var diatonic_n = oct * 7 + pnames.indexOf(pname)
    return mid + (diatonic_n - mid_n) * snd
  }]

}

function coord_pitch(dc, pt, staff) {
  // Compute the diatonic pitch that best matches a specific height
  // relative to a specific staff.
  var n = staff.getElementsByClassName('note')[0]
  // TODO: Handle if there are no notes in the current staff
  //  var [y_to_p,p_to_y] = pitch_grid(staff,n);
  return staff.y_to_p(pt.y)
}

// Same procedure as for coord_staff, if we're not allowing new chords
function closest_note(dc, pt, staff) {
  var notes = Array.from(staff.getElementsByClassName('note')).map((n) => [note_coords(n)[0], n])
  if (notes.length == 0)
    return null
  notes.sort((a, b) => a[0] - b[0])
  var index_maybe = notes.findIndex((n) => pt.x < n[0])
  if (index_maybe == 0)
    return notes[0][1]
  if (index_maybe == -1)
    return notes[notes.length - 1][1]
  const divider = average2(notes[index_maybe - 1][0],
    notes[index_maybe][0])
  if (pt.x < divider)
    return notes[index_maybe - 1][1]
  else
    return notes[index_maybe][1]
}

function note_params() {
  // Compute the note parameters that make sense for the pointer position
  // at this particular time.
  // Return the pitch parameters (diatonic pitch name and octave) and the
  // event relative to which the note should be placed in the MEI
  // (simultaneous to or before - null for last)
  var current_draw_context = getCurrentDrawContext()
  var dc = current_draw_context
  const pt = getPointerSVGCoords()
  const measure = coord_measure(dc, pt)
  if (!measure) {
    console.log('Pointer outside measures')
    return [null, null, null]
  }
  const staff = coord_staff(dc, pt, measure)
  const [pname, oct] = coord_pitch(dc, pt, staff)
  const sim_note = closest_note(dc, pt, staff)
  if (!sim_note)
    return [null, null, null]
  //  const [rel_event,simul] = coord_event(dc,pt, staff, measure);
  return [pname, oct, sim_note]
}

function note_params_coords_sim(pname, oct, note) {
  var staff = note.closest('.staff') // Assume we're in the same staff
  var n = staff.getElementsByClassName('note')[0]
  // TODO: Handle if there are no notes in the current staff
  //  var [y_to_p,p_to_y] = pitch_grid(staff,note);
  return [note_coords(note)[0], staff.p_to_y(pname, oct)]
}

function show_note(pname, oct, note, sim = true, id = '') {
  var current_draw_context = getCurrentDrawContext()
  var dc = current_draw_context
  var curr_elem = document.getElementById(id)
  if (curr_elem)
    curr_elem.parentElement.removeChild(curr_elem)
  if (sim) {
    let [x, y] = note_params_coords_sim(pname, oct, note)
    // "Copy" the other note
    // TODO use Smart(tm) computations to draw it independently, with smart
    // stem and notehead directions
    let [nx, ny] = note_coords(note)
    var u = document.createElementNS('http://www.w3.org/2000/svg', 'use')
    u.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#' + note.id)
    // And offset it with A Bit
    u.setAttribute('x', x - nx)
    u.setAttribute('y', y - ny)
    u.id = id
    note.parentElement.appendChild(u)
  }
}

function draw_note(pname, oct, note, sim = true, id = '') {
  var current_draw_context = getCurrentDrawContext()
  var dc = current_draw_context
  var curr_elem = document.getElementById(id)
  var added = []
  if (curr_elem)
    curr_elem.parentElement.removeChild(curr_elem)
  if (sim) {
    let [x, y] = note_params_coords_sim(pname, oct, note)
    // "Copy" the other note
    // TODO use Smart(tm) computations to draw it independently, with smart
    // stem and notehead directions
    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    var gh = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    var u = document.createElementNS('http://www.w3.org/2000/svg', 'use')
    // Same notehead
    u.setAttributeNS('http://www.w3.org/1999/xlink', 'href',
      note.getElementsByTagName('use')[0].getAttributeNS('http://www.w3.org/1999/xlink', 'href'))
    // And scale and place it appropriately
    u.setAttribute('x', x - 100)
    u.setAttribute('y', y)
    u.setAttribute('height', '720px')
    u.setAttribute('width', '720px')
    g.id = id
    g.classList.add('note')
    gh.classList.add('notehead')
    gh.appendChild(u)
    g.appendChild(gh)
    note.parentElement.appendChild(g)
    g.onclick = () => toggle_selected(g)
    added.push(g)
  }
  return added.reverse()
}

function add_note(layer_context, pname, oct, note, sim = true, id = '') {
  var l = get_by_id(mei, get_id(note))
  if (!layer_context.score_elem.contains(l)) {
    console.log('Note not in layer?')
    return false
  }
  var n = mei.createElement('note')
  var added = []
  n.setAttribute('xml:id', id)
  if (sim) {
    let c
    if (l.closest('chord'))
      c = l.closest('chord')
    else {
      c = note_to_chord(mei, l)
      l.parentElement.insertBefore(c, l)
      l.parentElement.removeChild(l)
      c.appendChild(l)
      added.push(c)
    }
    n.setAttribute('pname', pname)
    // TODO Figure out accidentals, gestural or otherwise
    n.setAttribute('oct', oct)
    c.appendChild(n)
    added.push(n)
    layer_context.id_mapping.push([id, id])
  } else {
    console.log('Not implemented')
    return false
  }
  return added.reverse()
}

export function do_note(pname, oct, note, offset, id, redoing = false) {
  var new_element_id = 'new-' + random_id()
  let n = note
  if (typeof (id) != 'undefined')
    new_element_id = id
  var added = []
  // Draw it temporarily
  console.log(note)
  added.push(draw_note(pname, oct, note, offset, new_element_id))
  // Add it to the current layer
  var current_draw_context = getCurrentDrawContext()
  added.push(add_note(current_draw_context.layer, pname, oct, note, offset, new_element_id))
  toggle_placing_note()
  if (!redoing)
    flush_redo()
  var undo_actions = getUndoActions()
  undo_actions.push(['add note', added.reverse(), [n], []])
}

export function place_note() {
  var current_draw_context = getCurrentDrawContext()
  var placing_note = getPlacingNote()
  if (placing_note != '' && current_draw_context.canEdit) {
    let [pname, oct, note] = note_params()
    if (!pname)
      return
    do_note(pname, oct, note, true)
  }
}

export function start_placing_note() {
  var current_draw_context = getCurrentDrawContext()
  var placing_note = getPlacingNote()
  if (typeof (current_draw_context) != 'undefined') {
    if (!current_draw_context.canEdit)
      return
    let [pname, oct, note] = note_params()
    placing_note = 'temp' + random_id()
    setPlacingNote(placing_note)
    document.getElementById('layers').style.cursor = 'crosshair'
    if (pname)
      show_note(pname, oct, note, true, placing_note)
  }
}

export function stop_placing_note() {
  var placing_note = getPlacingNote()
  let elem = document.getElementById(placing_note)
  if (elem)
    elem.parentElement.removeChild(elem)
  placing_note = ''
  setPlacingNote(placing_note)
  document.getElementById('layers').style.cursor = 'default'
}

export function toggle_placing_note() {
  var current_draw_context = getCurrentDrawContext()
  var placing_note = getPlacingNote()
  if (current_draw_context.canEdit) {
    if (placing_note) {
      stop_placing_note()
      return false
    }

    start_placing_note()
    return true
  }
}

export function update_placing_note() {
  var current_draw_context = getCurrentDrawContext()
  if (!current_draw_context.canEdit) {
    return
  }
  let [pname, oct, note] = note_params()
  if (pname) {
    show_note(pname, oct, note, true, getPlacingNote())
  }
}
