/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/

/**
 * Utility functions for SVG rendering after undo/redo operations.
 *
 * The key principle: after undo/redo, we re-render affected SVG elements
 * based on MEI state, rather than trying to manipulate stored DOM references.
 */

import { draw_relation, draw_metarelation } from '../action/draw'
import { mark_secondaries, unmark_secondaries, get_by_id, get_id } from '../utils/misc'
import { toggle_shade, adjustAllLayersSvgDimensions } from '../modules/UI/utils/misc'
import { getById } from './meiUtils'

/**
 * Remove SVG elements for a relation from all draw contexts.
 * @param {Object[]} drawContexts - Array of draw contexts
 * @param {string} relationId - The relation's xml:id
 */
export function removeSvgRelation(drawContexts, relationId) {
  const cleanId = relationId.startsWith('#') ? relationId.slice(1) : relationId

  for (const dc of drawContexts) {
    // Find the SVG element with the prefixed ID
    const svgId = dc.id_prefix + cleanId
    const svgElem = document.getElementById(svgId)
    if (svgElem) {
      svgElem.remove()
    }

    // Also remove any elements with oldid attribute matching this ID
    const oldIdElems = dc.svg_elem.querySelectorAll(`[oldid="${cleanId}"]`)
    oldIdElems.forEach(elem => elem.remove())
  }

  adjustAllLayersSvgDimensions()
}

/**
 * Remove SVG elements for a note from all draw contexts.
 * Only removes the graphical element, not the MEI element.
 * @param {Object[]} drawContexts - Array of draw contexts
 * @param {string} noteId - The note's xml:id
 */
export function removeSvgNote(drawContexts, noteId) {
  const cleanId = noteId.startsWith('#') ? noteId.slice(1) : noteId

  for (const dc of drawContexts) {
    const svgId = dc.id_prefix + cleanId
    const svgElem = document.getElementById(svgId)
    if (svgElem) {
      svgElem.remove()
    }
  }

  adjustAllLayersSvgDimensions()
}

/**
 * Render a relation in the SVG based on its MEI node.
 * @param {Object} drawContext - The draw context to render in
 * @param {Element} meiGraph - The MEI graph element
 * @param {string} relationId - The relation's xml:id
 * @returns {Element|null} The created SVG element, or null if failed
 */
export function renderRelation(drawContext, meiGraph, relationId) {
  // Try to find the node in the graph element first, then in the document
  let meiNode = getById(meiGraph, relationId)
  if (!meiNode) {
    meiNode = getById(meiGraph.getRootNode(), relationId)
  }
  if (!meiNode) {
    console.warn(`Cannot render relation: MEI node not found for ${relationId}`)
    console.debug('Searched in meiGraph:', meiGraph)
    console.debug('meiGraph children:', meiGraph.children?.length)
    return null
  }

  const svgElem = draw_relation(drawContext, meiGraph, meiNode)
  if (svgElem) {
    mark_secondaries(drawContext, meiGraph, meiNode)
  }

  adjustAllLayersSvgDimensions()
  return svgElem
}

/**
 * Render a metarelation in the SVG based on its MEI node.
 * @param {Object} drawContext - The draw context to render in
 * @param {Element} meiGraph - The MEI graph element
 * @param {string} metarelationId - The metarelation's xml:id
 * @returns {Element|null} The created SVG element, or null if failed
 */
export function renderMetarelation(drawContext, meiGraph, metarelationId) {
  const meiNode = getById(meiGraph.getRootNode(), metarelationId)
  if (!meiNode) {
    console.warn(`Cannot render metarelation: MEI node not found for ${metarelationId}`)
    return null
  }

  const svgElem = draw_metarelation(drawContext, meiGraph, meiNode)
  adjustAllLayersSvgDimensions()
  return svgElem
}

/**
 * Update the visual type/shade of a relation in the SVG.
 * @param {Object[]} drawContexts - Array of draw contexts
 * @param {string} relationId - The relation's xml:id
 * @param {string} type - The relation type
 */
export function updateRelationType(drawContexts, relationId, type) {
  const cleanId = relationId.startsWith('#') ? relationId.slice(1) : relationId

  for (const dc of drawContexts) {
    // Update the main element
    const svgId = dc.id_prefix + cleanId
    const svgElem = document.getElementById(svgId)
    if (svgElem) {
      svgElem.setAttribute('type', type)
      toggle_shade(svgElem)
    }

    // Also update elements with oldid
    const oldIdElem = document.getElementById(cleanId)
    if (oldIdElem) {
      oldIdElem.setAttribute('type', type)
      toggle_shade(oldIdElem)
    }

    // Update any elements queried by oldid attribute
    const oldIdElems = dc.svg_elem.querySelectorAll(`[oldid="${cleanId}"]`)
    oldIdElems.forEach(elem => {
      elem.setAttribute('type', type)
      toggle_shade(elem)
    })
  }
}

/**
 * Unmark secondary notes for a relation before removing it.
 * @param {Object} drawContext - The draw context
 * @param {Element} meiGraph - The MEI graph element
 * @param {string} relationId - The relation's xml:id
 */
export function unmarkRelationSecondaries(drawContext, meiGraph, relationId) {
  const meiNode = getById(meiGraph.getRootNode(), relationId)
  if (meiNode && meiNode.getAttribute('type') === 'relation') {
    unmark_secondaries(drawContext, meiGraph, meiNode)
  }
}

/**
 * Mark secondary notes for a relation after adding it.
 * @param {Object} drawContext - The draw context
 * @param {Element} meiGraph - The MEI graph element
 * @param {string} relationId - The relation's xml:id
 */
export function markRelationSecondaries(drawContext, meiGraph, relationId) {
  const meiNode = getById(meiGraph.getRootNode(), relationId)
  if (meiNode && meiNode.getAttribute('type') === 'relation') {
    mark_secondaries(drawContext, meiGraph, meiNode)
  }
}

/**
 * Update the relation tree UI if it's visible.
 */
export function updateRelationTree() {
  window.relationTreeInstance?.updateIfVisible()
}

/**
 * Deselect all currently selected elements.
 * @param {Function} toggleSelected - The toggle_selected function
 */
export function deselectAll(toggleSelected) {
  if (window.selected) {
    window.selected.forEach(x => toggleSelected(x, false))
  }
  if (window.extraselected) {
    window.extraselected.forEach(x => toggleSelected(x, true))
  }
}

/**
 * Restore a previous selection state.
 * @param {Object} selectionState - Object with selected and extraselected arrays (containing IDs)
 * @param {Function} toggleSelected - The toggle_selected function
 */
export function restoreSelection(selectionState, toggleSelected) {
  if (!selectionState) return

  // Restore selected
  if (selectionState.selected) {
    for (const id of selectionState.selected) {
      const elem = document.getElementById(id)
      if (elem) {
        toggleSelected(elem, false)
      }
    }
  }

  // Restore extraselected
  if (selectionState.extraselected) {
    for (const id of selectionState.extraselected) {
      const elem = document.getElementById(id)
      if (elem) {
        toggleSelected(elem, true)
      }
    }
  }
}

/**
 * Capture the current selection state (as IDs only).
 * @returns {Object} Selection state with selected and extraselected arrays
 */
export function captureSelectionState() {
  return {
    selected: (window.selected || []).map(elem => elem.id).filter(Boolean),
    extraselected: (window.extraselected || []).map(elem => elem.id).filter(Boolean)
  }
}
