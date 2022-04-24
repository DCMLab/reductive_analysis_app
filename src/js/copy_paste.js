/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/
import { notes_template,
	 relation_get_notes,
	 relation_get_notes_separated,
	 get_by_id,
	 get_id,
	 id_in_svg,
	 notes_in_range,
	 draw_context_of,
  time_offset,
  pitch_offset, } from './utils'

import { toggle_selected } from './ui'

import { do_relation } from './app'

var copy = {}

export function do_copy() {
  let sel = selected.concat(extraselected)
  // Check for relations
  if (sel.length == 0 || !sel[0].classList.contains('relation')) {
    console.log('No relation selected')
    return
  }
  // Gather notes
  let ns = sel.flatMap((r) => relation_get_notes(get_by_id(mei, get_id(r))))
  // Create emplate map
  let ns_template = notes_template(ns)
  // Save relations and template map to global/static copy
  copy = { template: ns_template, rels: sel }
}

export function do_paste() {
  if (!copy) {
    console.log('No copy to paste')
    return
  }
  let sel = selected.concat(extraselected)
  if (sel.length != 1 || !sel[0].classList.contains('note')) {
    console.log('Pasting requires selecting a single note, for now.')
    return
  }
  // Use selected note as root for comparison
  let n_ref = get_by_id(mei, get_id(sel[0]))
  let p_offs = copy.template.map((n) => n.p_off)
  p_offs = p_offs.sort((a, b) => a - b)
  // Find matching notes according to map
  let n_candidates = notes_in_range(n_ref, p_offs[0],
    p_offs[p_offs.length - 1],
					   copy.template[copy.template.length - 1].t_off)

  copy.template.forEach((o) => o.n_to = undefined)
  for (var n_cand of n_candidates) {
    let t_off = time_offset(n_cand, n_ref)
    let p_off = pitch_offset(n_cand, n_ref)
    for (var t_cand of copy.template) {
      if (t_off == t_cand.t_off &&
	 p_off == t_cand.p_off) {
        // If two matching notes are found, give up
        if (t_cand.n_to != undefined) {
	  console.log('Template mismatch: Found two matching notes: ', t_cand, n_cand)
	  return
        }
        t_cand.n_to = n_cand
      }
    }
  }
  // If some original note is unmatches, give up
  for (var t of copy.template) {
    if (t.n_to == undefined) {
      console.log('Template mismatch: No matching note found: ', t)
      return
    }
  }

  const dc = draw_context_of(sel[0])
  toggle_selected(sel[0])
  for (var r of copy.rels) {
    let rel = get_by_id(mei, get_id(r))
    let [prims, secs] = relation_get_notes_separated(rel)
    for (let n of prims) {
      let t = copy.template.find((t) => t.n_from == n)
      let svg_n = get_by_id(document, id_in_svg(dc, get_id(t.n_to)))
      toggle_selected(svg_n, true)
    }
    for (let n of secs) {
      let t = copy.template.find((t) => t.n_from == n)
      let svg_n = get_by_id(document, id_in_svg(dc, get_id(t.n_to)))
      toggle_selected(svg_n)
    }
    do_relation(r.getAttribute('type'))
  }

  // Go through each relation, select the corresponding notes, and
  // do_relation()
}
