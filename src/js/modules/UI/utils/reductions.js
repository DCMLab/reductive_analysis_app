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

function unlockUI() {
  const draw_context = getDrawContexts().find(e => e.canEdit)
  draw_context.svg_elem.classList.remove('locked')
  document.getElementById('undo').classList.remove('locked')
  document.getElementById('undo').disabled = false
  document.getElementById('redo').classList.remove('locked')
  document.getElementById('redo').disabled = false
}

function lockUI() {
  const draw_context = getDrawContexts().find(e => e.canEdit)
  draw_context.svg_elem.classList.add('locked')
  document.getElementById('undo').classList.add('locked')
  document.getElementById('undo').disabled = true
  document.getElementById('redo').classList.add('locked')
  document.getElementById('redo').disabled = true
}

export async function reduce() {

  const draw_context = getDrawContexts().find(e => e.canEdit)
  let fetched_note_diffs = []
  let fetched_relation_diffs = []
  let fetched_cycle = []

  if ((draw_context.note_diffs == null || draw_context.note_diffs.flat(1).length == 0) && (draw_context.relation_diffs == null || draw_context.relation_diffs.flat(1).length == 0) && (draw_context.cycle == null || draw_context.cycle.length == 0)) {
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
      }

      // Case 2: We received a graph cycle.
      if (Array.isArray(verdict) && verdict.length === 2 && typeof (verdict[0]) == 'string' && verdict[0] == 'GraphCycleError' && Array.isArray(verdict[1]) && verdict[1].length > 0) {
        fetched_cycle = verdict[1]
      }

      // Case 3: We received another algorithmic exception.
      if (Array.isArray(verdict) && verdict.length === 2 && typeof (verdict[0]) == 'string' && verdict[0] == 'Error' && typeof (verdict[1]) == 'string') {
        alert(`${verdict[1]}`)
      }

    } catch (error) { // We received a POST request exception.
      alert('Error:', error)
      return
    }

    let reductionWasFetched = true ? fetched_note_diffs.flat(1).length > 0 : false
    if (reductionWasFetched) {
      draw_context.current_layer_number = 0
      draw_context.note_diffs = fetched_note_diffs
      draw_context.relation_diffs = fetched_relation_diffs
    }

    let cycleWasFetched = true ? fetched_cycle.length > 0 : false
    if (cycleWasFetched) {
      draw_context.cycle = fetched_cycle
    }

    if (reductionWasFetched || cycleWasFetched) {
      do_deselect()

      lockUI()

      // Add stage numbers to notes
      const noteToStage = new Map()
      ;[...fetched_note_diffs].reverse().forEach((stageNotes, stageIndex) => {
        stageNotes.forEach(noteId => {
          noteToStage.set(noteId, stageIndex)
        })
      })
      fetched_note_diffs.flat(1).forEach(noteId => {
        const stageIndex = noteToStage.get(noteId)
        const noteEl = get_by_id(draw_context.svg_elem.getRootNode(), noteId)
        if (noteEl) {
          const useEl = noteEl.querySelector('.notehead use')
          if (useEl) {
            const transform = useEl.getAttribute('transform')
            const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/)
            if (match) {
              const x = parseFloat(match[1])
              const y = parseFloat(match[2])
              const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
              text.setAttribute('x', x - 300)
              text.setAttribute('y', y)
              text.setAttribute('class', 'stage-number')
              text.textContent = stageIndex + 1
              noteEl.appendChild(text)
            }
          }
        }
      })

      // Save meta-relation toggle state and hide meta-relations if the toggle is unset.
      const meta_toggle_on = document.getElementById('meta-relation-on')
      if (meta_toggle_on.getAttribute('saved-state') == '' || meta_toggle_on.getAttribute('saved-state') == null) {
        meta_toggle_on.setAttribute('saved-state', meta_toggle_on.checked ? 'on' : 'off')
        document.getElementById('meta-relation-off').click()
      }

    }
  }

  let layerContainsReduction = ((draw_context.note_diffs != null) && (draw_context.note_diffs.flat(1).length > 0) && (draw_context.relation_diffs != null) && (draw_context.relation_diffs.flat(1).length > 0))

  let layerContainsCycle = ((draw_context.cycle != null) && (draw_context.cycle.length > 0))

  if (layerContainsReduction) {
    const number_of_layers = draw_context.note_diffs.length - 1
    let current_layer_number = draw_context.current_layer_number

    if (current_layer_number < number_of_layers) {
      // Update the UI counter.
      document.getElementById('reduction-counter').innerText = `Reductive stage: ${number_of_layers - current_layer_number} / ${number_of_layers + 1}`

      // Hide the diff of the layer.
      draw_context.current_layer_number += 1
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

  if (layerContainsCycle) {
    // Update the UI indicator.
    document.getElementById('reduction-counter').innerText = `Cycle found.`

    // Color the cycle red.
    draw_context.cycle.forEach(id => {
      const el = get_by_id(draw_context.svg_elem.getRootNode(), id)
      const notehead = el?.querySelector('.notehead')
      if (notehead) {
        notehead.style.fill = 'red'
        notehead.classList.add('cycle')
      }
    })
  }
}

export function unreduce() {

  const draw_context = getDrawContexts().find(e => e.canEdit)

  let layerContainsReduction = ((draw_context.note_diffs != null) && Array.isArray(draw_context.note_diffs) && (draw_context.note_diffs.flat(1).length > 0) && (draw_context.relation_diffs != null) && Array.isArray(draw_context.relation_diffs) && (draw_context.relation_diffs.flat(1).length > 0))

  let layerContainsCycle = (draw_context.cycle != null && Array.isArray(draw_context.cycle) && draw_context.cycle.length > 0)

  // Not yet ready to exit reduction mode.
  let terminate = false

  if (layerContainsReduction) {
    const number_of_layers = draw_context.note_diffs.length - 1
    let current_layer_number = draw_context.current_layer_number

    if (current_layer_number > 0) {
      // Reveal the diff of the layer.
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
      document.getElementById('reduction-counter').innerText = `Reductive stage: ${number_of_layers - current_layer_number + 1} / ${number_of_layers + 1}`

      // If we reached the surface:
      if (current_layer_number == 0) {

        unlockUI()

        // Restore meta-relation toggle state and unset its attribute.
        const meta_toggle_on = document.getElementById('meta-relation-on')
        if (meta_toggle_on.getAttribute('saved-state') === 'on') meta_toggle_on.click()
        meta_toggle_on.removeAttribute('saved-state')

        // Update the UI counter.
        document.getElementById('reduction-counter').innerText = ``

        // Reset the draw context.
        draw_context.note_diffs = null
        draw_context.relation_diffs = null

        // Ready to exit reduction mode.
        terminate = true
      }
    }
  }

  if (layerContainsCycle) {
    draw_context.cycle.forEach(id => {
      const el = get_by_id(draw_context.svg_elem.getRootNode(), id)
      const notehead = el?.querySelector('.notehead')
      if (notehead) {
        notehead.style.fill = ''
        notehead.classList.remove('cycle')
      }
    })

    // Reset the draw context.
    draw_context.cycle = null

    // Ready to exit reduction mode.
    terminate = true
  }

  if (terminate) {

    unlockUI()

    // Remove stage numbers
    draw_context.svg_elem.querySelectorAll('.stage-number').forEach(el => el.remove())

    // Restore meta-relation toggle state and unset its attribute.
    const meta_toggle_on = document.getElementById('meta-relation-on')
    if (meta_toggle_on.getAttribute('saved-state') === 'on') meta_toggle_on.click()
    meta_toggle_on.removeAttribute('saved-state')

    // Update the UI indicator.
    document.getElementById('reduction-counter').innerText = ``
  }
}

