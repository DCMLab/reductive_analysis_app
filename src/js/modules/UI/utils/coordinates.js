/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/
import { getUndoActions } from '../../../bootstrap'
import { getCurrentDrawContext, getMouseX, getMouseY, getPlacingNote, setPlacingNote, toggle_selected } from './misc'
import { flush_redo } from '../../../action/undo_redo'
import { average2, get_by_id, get_raw_id, get_id, mod, note_coords, note_to_chord, random_id } from '../../../utils/misc'
import newNote from '../Note'
import { USE_NEW_HISTORY, getHistoryManager, AddNoteCommand } from '../../../history'

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
  var mei_note = get_by_id(mei, get_raw_id(note))
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
  // TODO: Handle if there are no notes in the current staff
  //  var [y_to_p,p_to_y] = pitch_grid(staff,n);
  return staff.y_to_p(pt.y)
}

// Same procedure as for coord_staff, if we're not allowing new chords
function closest_note(dc, pt, staff, measure) {
  // Search all staves in the measure to find note closest to x-position (beat)
  // This ensures we find a note at the same beat even if the target staff is empty there
  var notes = measure
    ? Array.from(measure.getElementsByClassName('note')).map((n) => [note_coords(n)[0], n])
    : Array.from(staff.getElementsByClassName('note')).map((n) => [note_coords(n)[0], n])
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
    return [null, null, null]
  }
  const staff = coord_staff(dc, pt, measure)
  const [pname, oct] = coord_pitch(dc, pt, staff)
  const sim_note = closest_note(dc, pt, staff, measure)
  if (!sim_note)
    return [null, null, null]
  //  const [rel_event,simul] = coord_event(dc,pt, staff, measure);
  return [pname, oct, sim_note, staff, measure]
}

function note_params_coords_sim(pname, oct, note) {
  // Get the staff under the cursor, not the staff containing the reference note
  var dc = getCurrentDrawContext()
  var pt = getPointerSVGCoords()
  var measure = coord_measure(dc, pt)
  var staff = measure ? coord_staff(dc, pt, measure) : note.closest('.staff')
  return [note_coords(note)[0], staff.p_to_y(pname, oct)]
}

function show_note(pname, oct, note, sim = true, id = '') {
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

function draw_note(pname, oct, note, sim = true, id = '', storedX = null, storedY = null) {
  var curr_elem = document.getElementById(id)
  var added = []
  if (curr_elem)
    curr_elem.parentElement.removeChild(curr_elem)
  if (sim) {
    // Use stored coordinates if provided (for redo), otherwise calculate
    let x, y
    if (storedX !== null && storedY !== null) {
      x = storedX
      y = storedY
      console.debug('draw_note: using stored coordinates', { x, y, storedX, storedY })
    } else {
      [x, y] = note_params_coords_sim(pname, oct, note)
      console.debug('draw_note: calculated coordinates', { x, y })
    }
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
    u.setAttribute('y', y + 100)
    u.setAttribute('height', '720px')
    u.setAttribute('width', '720px')
    g.id = id
    g.classList.add('note')
    gh.classList.add('notehead')
    g.dataset.onset = 'TBD'
    // Store coordinates for redo
    g.dataset.noteX = x
    g.dataset.noteY = y
    gh.appendChild(u)
    g.appendChild(gh)
    note.parentElement.appendChild(g)
    g.onclick = () => toggle_selected(g)
    added.push(g)
  }
  return added.reverse()
}

function add_note(layer_context, pname, oct, note, sim = true, id = '', targetStaff = null, targetMeasure = null) {
  var ref_id = get_raw_id(note)
  var ref_mei = get_by_id(mei, ref_id)
  if (!layer_context.score_elem.contains(ref_mei)) {
    return false
  }

  var onset = document.querySelector('svg #' + ref_id).dataset.onset
  var svg_l = document.querySelector('[data-onset="TBD"]')
  svg_l.dataset.onset = onset

  // Use passed-in target staff/measure, or fall back to cursor position
  var svg_measure = targetMeasure
  var svg_staff = targetStaff
  if (!svg_staff || !svg_measure) {
    var dc = getCurrentDrawContext()
    var pt = getPointerSVGCoords()
    svg_measure = coord_measure(dc, pt)
    svg_staff = coord_staff(dc, pt, svg_measure)
  }
  // Sort staves by y-position (same as coord_staff does) to get correct index
  var svg_staves = Array.from(svg_measure.getElementsByClassName('staff'))
    .map(s => [staff_midpoint(s), s])
    .sort((a, b) => a[0] - b[0])
    .map(pair => pair[1])
  var target_staff_n = svg_staves.indexOf(svg_staff) + 1

  // Get reference note's staff number
  var ref_staff_n = parseInt(ref_mei.closest('staff').getAttribute('n'))

  console.log('add_note:', { pname, oct, target_staff_n, ref_staff_n, svg_staff, svg_measure })

  var n = mei.createElementNS('http://www.music-encoding.org/ns/mei', 'note')
  var added = []
  n.setAttribute('xml:id', id)
  n.setAttribute('pname', pname)
  // TODO Figure out accidentals, gestural or otherwise
  n.setAttribute('oct', oct)

  if (sim) {
    if (target_staff_n === ref_staff_n) {
      // Same staff - use existing logic
      let c
      if (ref_mei.closest('chord'))
        c = ref_mei.closest('chord')
      else {
        c = note_to_chord(mei, ref_mei)
        ref_mei.parentElement.insertBefore(c, ref_mei)
        ref_mei.parentElement.removeChild(ref_mei)
        c.appendChild(ref_mei)
        added.push(c)
      }
      c.appendChild(n)
    } else {
      // Different staff - find target staff and layer
      var mei_measure = ref_mei.closest('measure')
      var target_staff = mei_measure.querySelector('staff[n="' + target_staff_n + '"]')
      var target_layer = target_staff.querySelector('layer')

      // Find existing event at same onset in target staff
      var existing = Array.from(target_layer.querySelectorAll('note, chord'))
        .find(el => {
          var el_id = el.getAttribute('xml:id')
          var svg_el = document.querySelector('svg [id$="' + el_id + '"]')
          return svg_el && svg_el.dataset.onset === onset
        })

      if (existing) {
        // Add to existing chord or convert note to chord
        if (existing.tagName === 'chord') {
          existing.appendChild(n)
        } else {
          let c = note_to_chord(mei, existing)
          existing.parentElement.insertBefore(c, existing)
          existing.parentElement.removeChild(existing)
          c.appendChild(existing)
          c.appendChild(n)
          added.push(c)
        }
      } else {
        // No existing event - create standalone note
        // Copy duration attributes from reference note (or its parent chord)
        var dur_source = ref_mei.closest('chord') || ref_mei
        for (const attr of ['dur', 'dots']) {
          if (dur_source.hasAttribute(attr))
            n.setAttribute(attr, dur_source.getAttribute(attr))
        }
        target_layer.appendChild(n)
      }
    }
    added.push(n)
    layer_context.id_mapping.push([id, id])
  } else {
    console.log('Not implemented')
    return false
  }
  return added.reverse()
}

export function do_note(pname, oct, note, offset, id, redoing = false, targetStaff = null, targetMeasure = null, storedX = null, storedY = null) {
  var new_element_id = 'added-' + random_id(8)
  let n = note
  if (typeof (id) != 'undefined')
    new_element_id = id
  var added = []
  // Draw it temporarily
  added.push(draw_note(pname, oct, note, offset, new_element_id, storedX, storedY))
  // Add it to the current layer
  var current_draw_context = getCurrentDrawContext()
  added.push(add_note(current_draw_context.layer, pname, oct, note, offset, new_element_id, targetStaff, targetMeasure))

  if (USE_NEW_HISTORY && !redoing) {
    // Use new command-based history system
    // Create a command that captures what was done for undo
    const command = new AddNoteCommand(pname, oct, note.id, new_element_id, targetStaff, targetMeasure)
    // Store the added elements info directly on the command for undo
    command._addedElements = added
    command._executed = true // Mark as already executed
    // Store callback for redo (avoids circular dependency)
    command._doNoteCallback = do_note
    // Capture coordinates from the created SVG element for redo
    const svgElem = document.getElementById(new_element_id)
    if (svgElem && svgElem.dataset) {
      command.storedX = svgElem.dataset.noteX ? parseFloat(svgElem.dataset.noteX) : null
      command.storedY = svgElem.dataset.noteY ? parseFloat(svgElem.dataset.noteY) : null
      console.debug('do_note: captured coordinates for redo', { storedX: command.storedX, storedY: command.storedY, noteId: new_element_id })
    }
    // Push directly to history (execute was already done above)
    getHistoryManager().undoStack.push(command)
    getHistoryManager().redoStack = []
    getHistoryManager()._emitChange()
  } else {
    // Legacy system
    if (!redoing)
      flush_redo()
    var undo_actions = getUndoActions()
    undo_actions.push(['add note', added.reverse(), [n], []])
  }
}

export function place_note() {
  var current_draw_context = getCurrentDrawContext()
  var placing_note = getPlacingNote()
  if (placing_note != '' && current_draw_context.canEdit) {
    let [pname, oct, note, targetStaff, targetMeasure] = note_params()
    if (!pname)
      return
    do_note(pname, oct, note, true, undefined, false, targetStaff, targetMeasure)
  }
}

export function start_placing_note() {
  var current_draw_context = getCurrentDrawContext()
  var placing_note = getPlacingNote()
  if (typeof (current_draw_context) != 'undefined') {
    if (!current_draw_context.canEdit)
      return
    let [pname, oct, note] = note_params()
    placing_note = 'temp' + random_id(8)
    setPlacingNote(placing_note)
    document.getElementById('layers').style.cursor = 'crosshair'
    if (pname)
      show_note(pname, oct, note, true, placing_note)
  }
}

export function stop_placing_note() {
  var placing_note = getPlacingNote()
  if (placing_note == '')
    return
  let elem = document.getElementById(placing_note)
  if (elem)
    elem.parentElement.removeChild(elem)
  placing_note = ''
  setPlacingNote(placing_note)
  document.getElementById('layers').style.cursor = ''
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
