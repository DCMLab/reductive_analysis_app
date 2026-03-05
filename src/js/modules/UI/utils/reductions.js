/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/
import { getDrawContexts } from '../../../bootstrap'
import { getHistoryManager } from '../../../history'
import { do_deselect } from './misc'
import {
  get_by_id
} from '../../../utils/misc'

/**
 * Add generation-stage numbers to notes in an SVG draw context.
 * @param {Object} draw_context - The draw context whose SVG will be annotated
 * @param {string[][]} note_diffs - Stage arrays as returned by /api/stages (already reversed)
 */
export function applyStageNumbers(draw_context, note_diffs) {
  const noteToStage = new Map()
  ;[...note_diffs].reverse().forEach((stageNotes, stageIndex) => {
    stageNotes.forEach(noteId => {
      noteToStage.set(noteId, stageIndex)
    })
  })
  note_diffs.flat(1).forEach(noteId => {
    const stageIndex = noteToStage.get(noteId)
    const noteEl = get_by_id(draw_context.svg_elem.getRootNode(), noteId)
    if (noteEl) {
      const notehead = noteEl.querySelector('.notehead')
      if (notehead) {
        const bbox = notehead.getBBox()
        const cx = bbox.x + bbox.width / 2
        const cy = bbox.y + bbox.height / 2
        const label = String(stageIndex + 1)
        const fontSize = label.length === 1 ? bbox.height * 0.9 : bbox.height * 0.6
        const useEl = notehead.querySelector('use')
        const href = useEl
          ? (useEl.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || useEl.getAttribute('href') || '')
          : ''
        const isFilled = href.includes('E0A4')
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        text.setAttribute('x', cx)
        text.setAttribute('y', cy)
        text.setAttribute('font-size', fontSize)
        text.setAttribute('class', 'stage-number')
        text.setAttribute('text-anchor', 'middle')
        text.setAttribute('dominant-baseline', 'central')
        text.style.fill = isFilled ? 'white' : 'saddlebrown'
        if (!isFilled) {
          text.setAttribute('stroke', 'white')
          text.setAttribute('stroke-width', fontSize * 0.15)
          text.style.paintOrder = 'stroke fill'
        }
        text.textContent = label
        noteEl.appendChild(text)
      }
    }
  })
}

/**
 * Remove all stage-number SVG text elements from a draw context.
 * @param {Object} draw_context - The draw context to clear
 */
export function clearStageNumbers(draw_context) {
  if (!draw_context) return
  draw_context.svg_elem.querySelectorAll('.stage-number').forEach(el => el.remove())
}

function unlockUI() {
  const draw_context = getDrawContexts().find(e => e.canEdit)
  draw_context.svg_elem.classList.remove('locked')
  const undoBtn = document.getElementById('undo')
  const redoBtn = document.getElementById('redo')
  undoBtn.classList.remove('locked')
  redoBtn.classList.remove('locked')
  // Set disabled state based on HistoryManager stack lengths
  const historyManager = getHistoryManager()
  undoBtn.disabled = historyManager.undoStack.length === 0
  redoBtn.disabled = historyManager.redoStack.length === 0
  // Re-enable generation numbers toggle
  const genOn = document.getElementById('gen-numbers-on')
  const genOff = document.getElementById('gen-numbers-off')
  if (genOn) genOn.disabled = false
  if (genOff) genOff.disabled = false
  // If the toggle was ON, trigger a debounced refresh via the shared event
  if (genOn?.checked) {
    document.dispatchEvent(new CustomEvent('relation-modified'))
  }
}

function lockUI() {
  const draw_context = getDrawContexts().find(e => e.canEdit)
  draw_context.svg_elem.classList.add('locked')
  document.getElementById('undo').classList.add('locked')
  document.getElementById('undo').disabled = true
  document.getElementById('redo').classList.add('locked')
  document.getElementById('redo').disabled = true
  // Disable generation numbers toggle and clear any shown numbers
  // (reduction mode will apply its own stage numbers)
  const genOn = document.getElementById('gen-numbers-on')
  const genOff = document.getElementById('gen-numbers-off')
  if (genOn) genOn.disabled = true
  if (genOff) genOff.disabled = true
  clearStageNumbers(draw_context)
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
      draw_context.current_layer_index = -2
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
      applyStageNumbers(draw_context, fetched_note_diffs)

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
    const max_layer_index = draw_context.note_diffs.length - 1
    if (draw_context.current_layer_index < max_layer_index - 1) {
      draw_context.current_layer_index += 1
    }
    // Update the UI counter.
    document.getElementById('reduction-counter').innerText = `Reductive stage: ${max_layer_index - draw_context.current_layer_index} / ${max_layer_index + 1}`
    console.log(`draw_context.current_layer_index: ${draw_context.current_layer_index}`)

    if (draw_context.current_layer_index >= 0 && draw_context.current_layer_index < max_layer_index) {
      // Hide the diff of the layer.
      draw_context.note_diffs[draw_context.current_layer_index].forEach(n => {
        let n_el = get_by_id(draw_context.svg_elem.getRootNode(), n)
        n_el.classList.add('hidden-reduced')
      })
      draw_context.relation_diffs[draw_context.current_layer_index].forEach(n => {
        let n_el = get_by_id(draw_context.svg_elem.getRootNode(), n)
        n_el.classList.add('hidden-reduced')
      })
    }
  }

  if (layerContainsCycle) {
    // Update the UI indicator.
    document.getElementById('reduction-counter').innerText = `∞ Cycle found`
    document.getElementById('reduction-counter').classList.add('cycle')

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
    console.log(`draw_context.current_layer_index: ${draw_context.current_layer_index}`)
    const max_layer_index = draw_context.note_diffs.length - 1

    if (draw_context.current_layer_index >= 0) {
      // Reveal the diff of the layer.
      draw_context.note_diffs[draw_context.current_layer_index].forEach(n => {
        let n_el = get_by_id(draw_context.svg_elem.getRootNode(), n)
        n_el.classList.remove('hidden-reduced')
      })
      draw_context.relation_diffs[draw_context.current_layer_index].forEach(n => {
        let n_el = get_by_id(draw_context.svg_elem.getRootNode(), n)
        n_el.classList.remove('hidden-reduced')
      })
      document.getElementById('reduction-counter').innerText = `Reductive stage: ${max_layer_index - draw_context.current_layer_index + 1} / ${max_layer_index + 1}`
    }

    if (draw_context.current_layer_index > -2) draw_context.current_layer_index = draw_context.current_layer_index - 1

    // If we reached the surface:
    if (draw_context.current_layer_index == -2) {

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

  if (layerContainsCycle) {
    draw_context.cycle.forEach(id => {
      const el = get_by_id(draw_context.svg_elem.getRootNode(), id)
      const notehead = el?.querySelector('.notehead')
      if (notehead) {
        notehead.style.fill = ''
        notehead.classList.remove('cycle')
        document.getElementById('reduction-counter').classList.remove('cycle')
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
    clearStageNumbers(draw_context)

    // Restore meta-relation toggle state and unset its attribute.
    const meta_toggle_on = document.getElementById('meta-relation-on')
    if (meta_toggle_on.getAttribute('saved-state') === 'on') meta_toggle_on.click()
    meta_toggle_on.removeAttribute('saved-state')

    // Update the UI indicator.
    document.getElementById('reduction-counter').innerText = ``
  }
}

