/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/
import { getDrawContexts } from '../../../bootstrap'
import { getHistoryManager } from '../../../history'
import { do_deselect } from './misc'
import {
  get_by_id,
  id_in_svg
} from '../../../utils/misc'

/**
 * Resolve an MEI note or relation ID to its element in one draw context.
 *
 * Prefers id_in_svg(), which accounts for the 'gn-' graph-node prefix and the
 * draw context's own ID prefix. The fallback is scoped to the draw context's SVG:
 * searching from the root node would match the first view's element whenever
 * several views are open.
 *
 * @param {Object} draw_context - The draw context to search
 * @param {string} id - MEI ID as returned by /api/stages
 * @returns {Element|null} The element, or null if it cannot be resolved
 */
export function resolve_in_context(draw_context, id) {
  if (!draw_context) return null
  // id_in_svg() dereferences layer.id_mapping unguarded. Both draw-context
  // constructors populate it, but fall back rather than throw if one ever does not:
  // an unresolved ID should stay a reported miss, never an exception.
  if (!draw_context.layer?.id_mapping) return get_by_id(draw_context.svg_elem, id)
  const svg_id = id_in_svg(draw_context, id)
  const by_svg_id = svg_id ? document.getElementById(svg_id) : null
  if (by_svg_id && draw_context.svg_elem.contains(by_svg_id)) return by_svg_id
  return get_by_id(draw_context.svg_elem, id)
}

/**
 * Report IDs that could not be resolved, rather than failing silently. An
 * unresolved ID means a note or relation that can be neither numbered, nor
 * reduced away, nor assigned a structural layer.
 *
 * @param {string} context - Where the failure occurred
 * @param {string[]} ids - The unresolved IDs
 */
function warn_unresolved(context, ids) {
  if (ids.length === 0) return
  console.warn(`${context}: ${ids.length} ID(s) could not be resolved; the corresponding notes or relations go untreated.`, ids)
}

// Attribute carrying a graph node's structural layer in exported MEI. Declared
// on <node> by the graphic-analysis customization; see src/js/utils/file.js.
const STRUCTURAL_LAYER_ATTRIBUTE = 'strucl'

/**
 * Map each ID to its structural layer, counting the background as 1.
 *
 * The stage arrays reach the UI reversed (foreground first); reversing them
 * back recovers the server's own generation order, whose index is the layer.
 *
 * @param {string[][]} diffs - Stage arrays as held by the UI (already reversed)
 * @returns {Map<string, number>} ID to 1-based structural layer
 */
function stage_map(diffs) {
  const map = new Map()
  ;[...diffs].reverse().forEach((stage, index) => {
    stage.forEach(id => map.set(id, index + 1))
  })
  return map
}

/**
 * Record structural layers on the MEI graph, so that they survive export.
 *
 * Note IDs arrive as score xml:ids and stand for the graph node 'gn-' + id;
 * relation IDs are already the xml:id of their <node>. Any previous values are
 * dropped first: a node whose layer the server no longer reports must not keep
 * the one it last had.
 *
 * @param {string[][]} note_diffs - Note stage arrays as held by the UI
 * @param {string[][]} relation_diffs - Relation stage arrays as held by the UI
 */
export function writeStructuralLayers(note_diffs, relation_diffs) {
  if (typeof mei == 'undefined' || !mei) return
  clearStructuralLayers()

  // Index the graph nodes once. Resolving each ID separately would rescan the
  // whole document per note, and could stray outside <graph> besides.
  const nodes = new Map()
  mei.querySelectorAll('graph node').forEach(node => {
    const id = node.getAttribute('xml:id')
    if (id) nodes.set(id, node)
  })

  const unresolved = []
  const stamp = (map, to_node_id) => {
    map.forEach((layer, id) => {
      const node = nodes.get(to_node_id(id))
      if (node) node.setAttribute(STRUCTURAL_LAYER_ATTRIBUTE, layer)
      else unresolved.push(id)
    })
  }
  stamp(stage_map(note_diffs || []), id => 'gn-' + id)
  stamp(stage_map(relation_diffs || []), id => id)
  warn_unresolved('writeStructuralLayers', unresolved)
}

/**
 * Remove every structural-layer attribute from the MEI graph. Called before
 * each write, and after any edit that invalidates the layers on record.
 */
export function clearStructuralLayers() {
  if (typeof mei == 'undefined' || !mei) return
  mei.querySelectorAll(`[${STRUCTURAL_LAYER_ATTRIBUTE}]`)
    .forEach(node => node.removeAttribute(STRUCTURAL_LAYER_ATTRIBUTE))
}

/**
 * Add generation-stage numbers to notes in an SVG draw context.
 * @param {Object} draw_context - The draw context whose SVG will be annotated
 * @param {string[][]} note_diffs - Stage arrays as returned by /api/stages (already reversed)
 */
export function applyStageNumbers(draw_context, note_diffs) {
  const noteToStage = stage_map(note_diffs)
  const unresolved = []
  note_diffs.flat(1).forEach(noteId => {
    const stageIndex = noteToStage.get(noteId)
    const noteEl = resolve_in_context(draw_context, noteId)
    if (!noteEl) {
      unresolved.push(noteId)
    } else {
      const notehead = noteEl.querySelector('.notehead')
      if (!notehead) {
        unresolved.push(`${noteId} (no notehead)`)
      } else {
        const bbox = notehead.getBBox()
        const cx = bbox.x + bbox.width / 2
        const cy = bbox.y + bbox.height / 2
        const label = String(stageIndex)
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
  warn_unresolved('applyStageNumbers', unresolved)
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

      // A cycle yields no layers at all; leave none on record either.
      if (cycleWasFetched) clearStructuralLayers()
      else writeStructuralLayers(fetched_note_diffs, fetched_relation_diffs)

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
      // Hide the diff of the layer. An ID that resolves to nothing is collected
      // and reported: left unguarded it would throw and abort the loop, leaving
      // every later note in the stage visible as well.
      const unresolved = []
      const hide = n => {
        let n_el = resolve_in_context(draw_context, n)
        if (n_el) n_el.classList.add('hidden-reduced')
        else unresolved.push(n)
      }
      draw_context.note_diffs[draw_context.current_layer_index].forEach(hide)
      draw_context.relation_diffs[draw_context.current_layer_index].forEach(hide)
      warn_unresolved(`reduce (stage ${draw_context.current_layer_index})`, unresolved)
    }
  }

  if (layerContainsCycle) {
    // Update the UI indicator.
    document.getElementById('reduction-counter').innerText = `∞ Cycle found`
    document.getElementById('reduction-counter').classList.add('cycle')

    // Color the cycle red.
    draw_context.cycle.forEach(id => {
      const el = resolve_in_context(draw_context, id)
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
      const unresolved = []
      const reveal = n => {
        let n_el = resolve_in_context(draw_context, n)
        if (n_el) n_el.classList.remove('hidden-reduced')
        else unresolved.push(n)
      }
      draw_context.note_diffs[draw_context.current_layer_index].forEach(reveal)
      draw_context.relation_diffs[draw_context.current_layer_index].forEach(reveal)
      warn_unresolved(`unreduce (stage ${draw_context.current_layer_index})`, unresolved)
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
      const el = resolve_in_context(draw_context, id)
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

