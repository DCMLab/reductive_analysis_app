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

export function reduce() {

  const draw_context = getDrawContexts().find(e => e.canEdit)
  let fetched_note_diffs = []
  let fetched_relation_diffs = []

  if (draw_context.note_diffs == null || draw_context.note_diffs.flat(1).length == 0) {
    // TODO: Fetch (and reverse!) layer diffs in exchange for MEI files (incl. graph).
    fetched_note_diffs = [['n1chcnfk', 'n16f07tm'], ['n1a2gxcu', 'nbqirrf'], ['nmdr98l', 'nmm59d4'], ['n6roxr5', 'nmc9aoo'], ['nvqsyar']].reverse()
    fetched_relation_diffs = [['he-9faaa'], ['he-9bda8', 'he-6301f', 'he-de1ec'], ['he-1d22e', 'he-ce40a', 'he-2cc5e', 'he-b4322'], ['he-ed17b', 'he-64da1', 'he-849c6', 'he-39e8d', 'he-3807'], ['he-9199d']].reverse()

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

