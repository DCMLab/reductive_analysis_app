/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/
import { getDrawContexts } from '../../../bootstrap'
import { do_deselect } from './misc'
import {
  get_by_id
} from '../../../utils/misc'

export async function reduce() {

  const draw_context = getDrawContexts().find(e => e.canEdit)
  let fetched_note_diffs = []
  let fetched_relation_diffs = []

  if ((draw_context.note_diffs == null & draw_context.relation_diffs == null) || (draw_context.note_diffs.flat(1).length == 0 && draw_context.relation_diffs.flat(1).length == 0)) {
    try {
      const response = await fetch('http://localhost:5100/api/stages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml' },
        body: new XMLSerializer().serializeToString(mei)
      })
      const verdict = await response.json()

      // Case 1: We received a reductive analysis.
      if (Array.isArray(verdict) && verdict.length === 2 && Array.isArray(verdict[0]) && Array.isArray(verdict[1])) {
        fetched_note_diffs = verdict[0].reverse()
        fetched_relation_diffs = verdict[1].reverse()
        console.log(fetched_note_diffs)
        console.log(fetched_relation_diffs)
      }

      // Case 2: We received a graph cycle.
      if (Array.isArray(verdict) && verdict.length === 2 && typeof (verdict[0]) == 'string' && verdict[0] == 'GraphCycleError' && Array.isArray(verdict[1])) {
        alert('Graph cycle.')
      }

      // Case 3: We received another exception.
      if (Array.isArray(verdict) && verdict.length === 2 && typeof (verdict[0]) == 'string' && verdict[0] == 'Error' && typeof (verdict[1]) == 'string') {
        alert(`${verdict[1]}`)
      }

    } catch (error) {
      alert('Error:', error)
      return
    }

    let reductionWasFetched = true ? fetched_note_diffs.flat(1).length > 0 : false
    if (reductionWasFetched) {
      draw_context.current_layer_number = 0
      draw_context.note_diffs = fetched_note_diffs
      draw_context.relation_diffs = fetched_relation_diffs
    } else return
  }

  let layerContainsReduction = ((draw_context.note_diffs != null) && (draw_context.note_diffs.flat(1).length > 0))

  if (layerContainsReduction) {
    // Block the UI.
    do_deselect()
    const number_of_layers = draw_context.note_diffs.length - 1
    let current_layer_number = draw_context.current_layer_number

    if (current_layer_number < number_of_layers) {
      draw_context.current_layer_number += 1
      draw_context.svg_elem.classList.add('locked')
      document.getElementById('undo').classList.add('locked')
      document.getElementById('undo').disabled = true
      document.getElementById('redo').classList.add('locked')
      document.getElementById('redo').disabled = true
      document.getElementById('reduction-counter').innerText = `Reductive stage: ${number_of_layers - current_layer_number}`
      // Hide the diff corresponding to that layer.
      draw_context.note_diffs[current_layer_number].forEach(n => {
        let n_el = get_by_id(draw_context.svg_elem.getRootNode(), n)
        n_el.classList.add('hidden-reduced')
      })
      draw_context.relation_diffs[current_layer_number].forEach(n => {
        let n_el = get_by_id(draw_context.svg_elem.getRootNode(), n)
        n_el.classList.add('hidden-reduced')
      })
    }

  }
}

export function unreduce() {

  const draw_context = getDrawContexts().find(e => e.canEdit)

  let layerContainsReduction = ((draw_context.note_diffs != null) && (draw_context.note_diffs.flat(1).length > 0))

  if (!layerContainsReduction) return

  const number_of_layers = draw_context.note_diffs.length - 1
  let current_layer_number = draw_context.current_layer_number

  if (current_layer_number > 0) {
    let current_layer_number = draw_context.current_layer_number - 1
    draw_context.note_diffs[current_layer_number].forEach(n => {
      let n_el = get_by_id(draw_context.svg_elem.getRootNode(), n)
      n_el.classList.remove('hidden-reduced')
    })
    draw_context.relation_diffs[current_layer_number].forEach(n => {
      let n_el = get_by_id(draw_context.svg_elem.getRootNode(), n)
      n_el.classList.remove('hidden-reduced')
    })
    draw_context.current_layer_number -= 1
    document.getElementById('reduction-counter').innerText = `Reductive stage: ${number_of_layers - current_layer_number + 1}`
    if (current_layer_number == 0) {
      draw_context.svg_elem.classList.remove('locked')
      document.getElementById('undo').classList.remove('locked')
      document.getElementById('undo').disabled = false
      document.getElementById('redo').classList.remove('locked')
      document.getElementById('redo').disabled = false
      document.getElementById('reduction-counter').innerText = ``
    }
  }

}

