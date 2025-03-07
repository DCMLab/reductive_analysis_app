/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/
import { getDrawContexts, getMeiGraph, getUndoActions } from './app'
import { toggle_selected } from './ui'
import { flush_redo } from './undo_redo'
import { get_by_id, get_class_from_classlist, get_id, unmark_secondaries } from './utils'

function delete_relation(elem) {
  console.debug('Using globals: mei for element selection')
  // Assume no meta-edges for now, meaning we only have to
  // remove the SVG elem, the MEI node, and any involved arcs
  const mei_id = get_id(elem)
  const mei_he = get_by_id(mei, mei_id)
  const svg_hes = []
  const is_meta_relation = get_class_from_classlist(elem) == 'metarelation'
  const mei_graph = getMeiGraph()
  const draw_contexts = getDrawContexts()
  for (const draw_context of draw_contexts) {
    const svg_he = get_by_id(document, draw_context.id_prefix + mei_id)
    if (svg_he) {
      svg_hes.push(svg_he)
      if (!is_meta_relation) unmark_secondaries(draw_context, mei_graph, mei_he)
    }
  }

  // Find all arcs related to this element
  var arcs =
    Array.from(mei.getElementsByTagName('arc')).filter((arc) => {
      return arc.getAttribute('to') == '#' + elem.id ||
              arc.getAttribute('from') == '#' + elem.id
    })
  // Find meta-relations associated with this relation
  const result = find_all_parent_relations(elem, mei, draw_contexts, svg_hes)
  const meta_relations = result.meta_relations
  const meta_relation_arcs = result.meta_relation_arcs

  // Combine all elements that need to be removed
  let removed = arcs.concat(svg_hes).concat(meta_relations).concat(meta_relation_arcs)
  removed.push(mei_he)

  // Remove duplicates (in case some elements are counted twice)
  removed = [...new Set(removed)]

  const action_removed = removed.map(x => {
    const elems = [x, x.parentElement, x.nextSibling]
    // If x corresponds to an SVG note (try!), un-style it as if we were not hovering over the relation.
    // This is necessary when deleting via they keyboard (therefore while hovering).
    try {
      const element = document.querySelector(`g #${x.getAttribute('to').substring(4)}`)
      element.setAttribute('class', 'note')
    } catch (e) {}
    x.parentElement.removeChild(x)
    return elems
  })

  return action_removed
}

export function delete_relations(redoing = false) {
  console.debug('Using globals: selected for element selection, undo_actions for storing the action')
  // Assume no meta-edges for now, meaning we only have to
  var sel = selected.concat(extraselected)
  if (sel.length == 0 || !(get_class_from_classlist(sel[0]) == 'relation' ||
	                  get_class_from_classlist(sel[0]) == 'metarelation')) {
    console.log('No (meta)relation selected!')
    return
  }
  var removed = sel.flatMap(delete_relation)

  var undo_actions = getUndoActions()
  undo_actions.push(['delete relation', removed.reverse(), selected, extraselected])
  sel.forEach(toggle_selected)
  if (!redoing)
    flush_redo()
}

/**
 * Finds all meta-relations that reference a specific relation element, along with their
 * visual representations and connecting arcs.
 *
 * When a relation is deleted, any meta-relations that reference it should also be deleted.
 * This function recursively identifies all such parent relations (parents, grandparents, etc.)
 * and their associated elements.
 *
 * @param {Element} elem - The target relation element being deleted
 * @param {Document} mei - The MEI document containing the graph data
 * @param {Array} draw_contexts - The drawing contexts containing SVG representations
 * @param {Array} svg_hes - Array of SVG elements (this is modified by adding meta-relation SVGs)
 * @param {Set} [processedIds=new Set()] - Set of already processed meta-relation IDs to prevent infinite recursion
 *
 * @returns {Object} An object containing:
 *   - meta_relations: Array of MEI meta-relation nodes that reference the relation
 *   - meta_relation_arcs: Array of arcs connecting these meta-relations
 */
function find_all_parent_relations(elem, mei, draw_contexts, svg_hes, processedIds = new Set()) {
  let meta_relations = []
  let meta_relation_arcs = []

  const elemId = elem.id || get_id(elem)

  // Find arcs that connect meta-relations to this relation
  // Only look for arcs where this element is the target (to) - parent->child
  const meta_arcs = Array.from(mei.getElementsByTagName('arc')).filter(
    arc => arc.getAttribute('to') == '#' + elemId
  )

  // For each arc, find the meta-relation nodes that are parents of this element
  meta_arcs.forEach(arc => {
    // The source of the arc is the parent meta-relation
    const meta_id = arc.getAttribute('from').substring(1)

    // Skip if already processed
    if (processedIds.has(meta_id)) {
      return
    }

    processedIds.add(meta_id)
    const meta_node = get_by_id(mei, meta_id)

    if (meta_node && meta_node.getAttribute('type') === 'metarelation') {
      meta_relations.push(meta_node)

      // Find SVG elements for this meta-relation
      for (const draw_context of draw_contexts) {
        let svg_meta = get_by_id(document, draw_context.id_prefix + meta_id)
        if (svg_meta) {
          svg_hes.push(svg_meta)
        }
      }

      // Find all arcs related to this meta-relation
      const related_arcs = Array.from(mei.getElementsByTagName('arc')).filter(
        a => a.getAttribute('to') == '#' + meta_id || a.getAttribute('from') == '#' + meta_id
      )

      meta_relation_arcs = meta_relation_arcs.concat(related_arcs)

      // Recursively find parent meta-relations of this meta-relation
      const result = find_all_parent_relations(
        { id: meta_id },
        mei,
        draw_contexts,
        svg_hes,
        processedIds
      )

      // Merge results
      meta_relations = meta_relations.concat(result.meta_relations)
      meta_relation_arcs = meta_relation_arcs.concat(result.meta_relation_arcs)
    }
  })

  return { meta_relations, meta_relation_arcs }
}
