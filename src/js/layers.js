/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/
import { getDrawContexts } from './app'
import { clone_mei, get_by_id, get_id, id_in_svg, prefix_ids, note_to_space, chord_to_space } from './utils'

// This is code relating to the addition of new layers in analyses.

// Each layer is represented by a <score> element in the MEI - the
// surface being the first, and each subsequent layer making up a separate
// <score> element.

// DEPRECATED: Notes that reoccur in analysed layers from the surface
// should be connected using @copyof attributes, while the <score> elements
// could use @sameas to indicate that they represent the same pieces of
// music, just under different levels of abstraction.

// NEW: Notes and other elements are connected to their more original
// corresponding elements using the @corresp attribute

function layer_clone_element(changes, elem, new_children) {
  const no_notes_below = new_children.findIndex(
    (e) => e.nodeType == Node.ELEMENT_NODE &&
	                            (e.tagName == 'note' ||
	                            e.getElementsByTagName('note').length >
				    0)) == -1
  // No need to copy over empty beams and measures.
  if ((elem.tagName == 'beam' || elem.tagName == 'measure') && no_notes_below)
    return null
  // Replace empty chords with spaces
  if (elem.tagName == 'chord' && no_notes_below)
    return chord_to_space(mei, elem)
  var new_elem = elem.cloneNode()
  new_elem.setAttribute('corresp', elem.getAttribute('xml:id'))
  // We no longer make a difference between copies and not-copies
  /*
  if (changes) {
    new_elem.setAttribute('corresp', elem.getAttribute('xml:id'))
  } else {
    new_elem.setAttribute('copyof', elem.getAttribute('xml:id'))
  }
*/
  new_children.forEach((e) => new_elem.appendChild(e))
  return new_elem
}

function layerify(draw_context, elem) {
  if (elem.nodeType != Node.ELEMENT_NODE)
    return [elem.cloneNode(), false]
  var svg_elem = document.getElementById(id_in_svg(draw_context, get_id(elem)))
  if (elem.tagName == 'note' && (!svg_elem || svg_elem.classList.contains('hidden'))) // This elem has been reduced away
    return [note_to_space(mei, elem), true] // It may be that we should replace it with a space instead
  var results = Array.from(elem.childNodes).map((e) => layerify(draw_context, e))
  var new_children = results.map((p) => p[0]).filter((x) => x != null)
  var changes = (new_children.length != elem.childNodes.length) || // Something directly below was reduced
                 results.find((p) => p[1]) != undefined // Something further down changed
  return [layer_clone_element(changes, elem, new_children), changes]
}

export function new_layer(draw_context = null) {
  if (!draw_context) {
    draw_context = getDrawContexts()[0]
  }
  var mdiv_elem = draw_context.mei_mdiv
  var score_elem = mdiv_elem.children[0]
  var [new_mdiv_elem, changed] = layerify(draw_context, mdiv_elem)
  var n_layers = mdiv_elem.parentElement.getElementsByTagName('mdiv').length
  var prefix = n_layers + '-' // TODO: better prefix computation
  // The - is there to not clash with view
			     // prefixes

  prefix_ids(new_mdiv_elem, prefix) // Compute a better prefix
  // Insert after the previous
  mdiv_elem.parentNode.insertBefore(new_mdiv_elem, mdiv_elem.nextSibling)
  // The basic algorithm is to take the last score element (if we're doing
  // a linear order of layers, otherwise we need the score element to build
  // off of to be given as an argument), to clone it using cloneNode(), and
  // then to do a preorder traversal of the tree, and for each element
  // do the following pseudocode:
  //
  // FUNCTION LAYERIFY // This function takes a node in the score and
  //                   // returns NULL if it has been reduced, unchanged if
  //                   // it has no ID, and with a new ID and either
  //                   // @sameas or @copyof depending on if the subtree
  //                   // includes reduced nodes or not.
  // IF this node has been reduced THEN
  //   RETURN (NULL, T)
  // LET (new_children, changed) = UNZIP MAP LAYERIFY ONTO children
  // IF REDUCE changed WITH OR and F
  //   RETURN (link_with_sameas(this).with_children(new_children), T)
  // ELSE
  //   RETURN (link_with_copyof(this).with_children(new_children), F)
  //
  // After which we fit the modified tree with a new ID prefix (built as a
  // tree address in preparation of hierarchical layer arrangements) and
  // attach it as a sibling to the previous score element, and potentially
  // modify the scoreDef appropriately.
  return new_mdiv_elem
}

export function mei_for_layer(mei, mdiv_elem) {
  if (!mei.contains(mdiv_elem)) {
    console.log('MDiv element not in MEI, aborting')
    return null
  }
  var new_mei = clone_mei(mei)
  var our_mdiv
  if (!mdiv_elem.hasAttribute('xml:id'))
    our_mdiv = new_mei.getElementsByTagName('mdiv')[0]
  else
    our_mdiv = get_by_id(new_mei, mdiv_elem.getAttribute('xml:id'))
  var paren = our_mdiv.parentElement
  for (let mdiv of Array.from(paren.getElementsByTagName('mdiv'))) {
    if (mdiv === our_mdiv)
      continue
    else
      paren.removeChild(mdiv)
  }
  return new_mei
}

// PLANS 2021-03-09
// layerify now works as expected, making sameas/copyof connections when
// appropriate. What's next? One possible feature is to remove elements
// (measures, beams) with no notes in them. Beams in particular need
// removing as Verovio chokes otherwise. Another possible feature is to
// replace the note with a rest to make sure that they get the proper
// horizontal alignment.

// These are all useful features, but first is making a proper new layer
// This requires:
//  * Prefix-modifying the new tree, including determining the prefix
//  * Updating the rendering code to get Verovio to render some specific
//    layer.
//  * Updating adressing to make sure that a) new relations use the
//    shallowest possible entity of which the current is sameas/copyof
//  *
