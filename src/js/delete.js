/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/
import $ from 'jquery'

import { getDrawContexts, getMeiGraph, getUndoActions } from './app'
import { toggle_selected } from './ui'
import { flush_redo } from './undo_redo'
import { get_by_id, get_class_from_classlist, get_id, unmark_secondaries } from './utils'

function delete_relation(elem) {
  console.debug('Using globals: mei for element selection')
  // Assume no meta-edges for now, meaning we only have to
  // remove the SVG elem, the MEI node, and any involved arcs
  var mei_id = get_id(elem)
  var mei_he = get_by_id(mei, mei_id)
  var svg_hes = []
  var metarel = get_class_from_classlist(elem) == 'metarelation'
  var mei_graph = getMeiGraph()
  console.log(mei_graph)
  var draw_contexts = getDrawContexts()
  for (const draw_context of draw_contexts) {
    let svg_he = get_by_id(document, draw_context.id_prefix + mei_id)
    if (svg_he) {
      svg_hes.push(svg_he)
      if (!metarel)
        unmark_secondaries(draw_context, mei_graph, mei_he)
    }
  }

  var arcs =
    Array.from(mei.getElementsByTagName('arc')).filter((arc) => {
      return arc.getAttribute('to') == '#' + elem.id ||
              arc.getAttribute('from') == '#' + elem.id
    })
  var removed = arcs.concat(svg_hes)
  removed.push(mei_he)
  var action_removed = removed.map((x) => {
    var elems = [x, x.parentElement, x.nextSibling]
    // If x corresponds to an SVG note (try!), un-style it as if we were not hovering over the relation.
    // This is necessary when deleting via they keyboard (therefore while hovering).
    try {
      const element = document.querySelector(`g #${x.getAttribute('to').substring(4)}`)
      element.setAttribute('class', 'note')
    } catch (e) {
    }
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
