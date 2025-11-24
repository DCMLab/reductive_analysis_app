/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/
import '/sass/app.scss'
import '/css/style.css'
import '/css/select2.min.css'

import $ from 'jquery'

import { debug } from './conf'

import newApp from './app'
import { downloadAs } from './utils/file'

// Clicking selects, exposed globally
window.selected = []

// Shift-clicking extra selects, exposed globally
window.extraselected = []

// Regular imports

import { add_metarelation, add_relation } from './action/graph'
import { mei_for_layer, new_layer } from './utils/layers'
import { new_sliced_layer } from './utils/slicing'
import { draw_relation, draw_metarelation } from './action/draw'

import {
  adjustAllLayersSvgDimensions,
  drag_selector_installer,
  getCurrentDrawContext,
  handle_click,
  handle_keydown,
  handle_keypress,
  handle_keyup,
  toggle_selected,
  toggle_shade,
  setCurrentDrawContext,
} from './modules/UI/utils/misc'

import {
  add_mei_node_for,
  check_for_duplicate_relations,
  fix_synonyms,
  fix_corresp,
  fix_layers,
  get_by_id,
  get_by_oldid,
  get_class_from_classlist,
  get_id,
  get_id_pairs,
  id_in_svg,
  id_or_oldid,
  mark_secondaries,
  new_layer_element,
  new_view_elements,
  note_coords,
  note_to_rest,
  relation_get_notes,
  sanitize_xml,
} from './utils/misc'
import { compute_measure_map, pitch_grid } from './modules/UI/utils/coordinates'
import { flush_redo } from './action/undo_redo'
import { comboRelationTypes } from './modules/Relations/config'
import { setAttributes } from './utils/dom'

/**
 * JS polyfill for the CSS `:has` pseudo-selector. It completes the PostCSS
 * plugin doing the transformation (see `postcss.config.js`).
 * - https://developer.mozilla.org/en-US/docs/Web/CSS/:has
 * - https://github.com/csstools/postcss-plugins/tree/main/experimental
 */
import cssHasPseudo from 'css-has-pseudo'
cssHasPseudo(document)

// GLOBALS
// Load Verovio
var vrvToolkit
// And the underlying MEI
window.mei = null
// And the graph node in the MEI
var mei_graph
// And the MIDI
var midi
var orig_midi
// This is the MEI as text (pre-parse)
var data
// We need a reader
var reader = new FileReader()
var filename
// Our undo stack.
var undo_actions = []

var redo_actions = [] // TODO, maybe?

// Each draw context contains information relevant to drawing
// into one of the SVG renders. In particular, we store
//  * The <div> element containing the SVG
//  * The outer <div> element that also contains the view-specific buttons
//  and controls
//  * The amount of zoom (should be moved to style?)
//  * The stack of local reduce actions
//  * The layer context to which this view belongs
//  * The prefix used for the element IDs in the SVG (compared
//    to the MEI)
// The first element is the latest
var draw_contexts = []

// Each layer context contains information relevant to the layer, such as
//  * The rendered MEI
//  * The score element in the original MEI
//  * The <div> element containing the layer
//  * A mapping from each element in the layer score element to its
//  canonical representative
var layer_contexts = []

// Prevent unsaved data loss by warning user before browser unload events (reload, close).
// Attempting to do this in compliant fashion (https://html.spec.whatwg.org/#prompt-to-unload-a-document).
window.addEventListener('beforeunload', function (e) {
  var confirmationMessage = 'Leave app? You may lose unsaved changes.'

  e.preventDefault()
  e.returnValue = confirmationMessage
  return confirmationMessage // Some browsers don't follow the standard and require this.
})

// Once things are loaded, do configuration stuff

// each relation type is initialized here, among other things

$(document).ready(function() {
  document.getElementsByTagName('html')[0].classList.remove('loader')
})

// Optional catch-all exception handler.
if (debug) {
  window.onerror = function errorHandler(errorMsg, url, lineNumber) {
    document.getElementsByTagName('html')[0].classList.remove('loader')
    alert(`An error occured: ${errorMsg}
   Please report the relevant console log as a GitHub issue.
   The app will try to continue running nonetheless.`)
    return false
  }
}

// OK we've selected stuff, let's make the selection into a
// "relation".
export function do_relation(type, id, redoing = false) {
  console.debug('Using globals: selected, extraselected, mei, undo_actions')
  if (selected.length == 0 && extraselected == 0) {
    return
  }

  const draw_context = draw_contexts.find(e => e.canEdit)

  var he_id, mei_elems
  if (selected.concat(extraselected)[0].classList.contains('relation')) {
    var types = []
    selected.concat(extraselected).forEach((he) => {
      // TODO: move type_synonym application so that this
      // is the right type == the one from the MEI
      types.push([he.getAttribute('type'), type])
      var id = id_or_oldid(he)
      var hes = [get_by_id(document, id)].concat(get_by_oldid(document, id))
      hes.forEach((he) => he.setAttribute('type', type))
      var mei_he = get_by_id(mei, id)
      mei_he.getElementsByTagName('label')[0].setAttribute('type', type)
      hes.forEach(toggle_shade)
    })
    // update_text()
    undo_actions.push(['change relation type', types.reverse(), selected, extraselected])
  } else if (selected.concat(extraselected)[0].classList.contains('note')) {
    check_for_duplicate_relations(type, extraselected, selected)
    var added = []
    // Add new nodes for all notes
    var primaries = extraselected.map((e) => add_mei_node_for(mei_graph, e))
    var secondaries = selected.map((e) => add_mei_node_for(mei_graph, e))
    added.push(primaries.concat(secondaries));
    [he_id, mei_elems] = add_relation(mei_graph, primaries, secondaries, type, id)
    added.push(mei_elems)

    let g_elem = draw_relation(draw_context, mei_graph, get_by_id(mei_graph.getRootNode(), he_id))
    if (g_elem) {
      added.push(g_elem) // Draw the edge
      mark_secondaries(draw_context, mei_graph, get_by_id(mei_graph.getRootNode(), he_id))
    }

    undo_actions.push(['relation', added.reverse(), selected, extraselected])
    selected.concat(extraselected).forEach(toggle_selected) // De-select
  }
  if (!redoing)
    flush_redo()

  // Update hierarchy tree if visible
  window.relationTreeInstance?.updateIfVisible()

  adjustAllLayersSvgDimensions()
}

export function do_comborelation(type) {
  var all = selected.concat(extraselected)
  if (all.length < 3 || extraselected.length > 2) { return }
  all.sort((a, b) => {
    var [ax, ay] = note_coords(a) // ay never used
    var [bx, by] = note_coords(b) // by never used
    return ax - bx
  })
  var firstNote = all.shift()
  var secondNote = all.pop()
  selected = selected.filter((e) => e == firstNote || e == secondNote)
  do_relation(comboRelationTypes.main[type].outer)

  extraselected = [firstNote, secondNote]
  selected = all

  do_relation(comboRelationTypes.main[type].total)

  // Update hierarchy tree if visible
  window.relationTreeInstance?.updateIfVisible()
}

export function do_metarelation(type, id, redoing = false) {
  console.debug('Using globals:  mei_graph, selected, extraselected')
  if (selected.length == 0 && extraselected == 0) {
    return
  }

  const draw_context = draw_contexts.find(e => e.canEdit)

  var ci = get_class_from_classlist(selected.concat(extraselected)[0])
  if (!(ci == 'relation' || ci == 'metarelation')) {
    return
  }
  var added = []
  var he_id, mei_elems

  var primaries = extraselected.map((e) =>
    get_by_id(mei_graph.getRootNode(), id_or_oldid(e)))
  var secondaries = selected.map((e) =>
    get_by_id(mei_graph.getRootNode(), id_or_oldid(e)))
  var [he_id, mei_elems] = add_metarelation(mei_graph, primaries, secondaries, type, id)
  added.push(mei_elems)

  added.push(draw_metarelation(draw_context, mei_graph, get_by_id(mei_graph.getRootNode(), he_id))) // Draw the edge

  undo_actions.push(['metarelation', added, selected, extraselected])
  selected.concat(extraselected).forEach(toggle_selected) // De-select
  if (!redoing)
    flush_redo()

  // Update hierarchy tree if visible
  window.relationTreeInstance?.updateIfVisible()

  adjustAllLayersSvgDimensions()
}

var rerendered_after_action

// If the MEI already has a graph, we add on to that. TODO:
// Check that the graph is actually our kind of graph
function add_or_fetch_graph() {
  console.debug('Using globals: mei')
  var existing = mei.getElementsByTagName('graph')
  if (existing.length) {
    // TODO: Not just grab the first one.
    return existing[0]
  }
  var elem = mei.createElement('graph')
  elem.setAttribute('type', 'directed')
  mei.getElementsByTagName('body')[0].appendChild(elem)
  return elem
}

function _remove_empty_xmlns(mei) {
  mei.querySelectorAll('*').forEach(el => {
    if (el.getAttribute('xmlns') === '') el.removeAttribute('xmlns')
  })
  return mei
}

export function save_mei() {
  var mei_clone = mei.cloneNode(true)
  for (var dc of draw_contexts) {
    if (!dc.canSave) {
      console.log('Trying to remove layer', dc)
      var layer_elem = get_by_id(mei_clone, dc.mei_mdiv.getAttribute('xml:id'))
      layer_elem.parentElement.removeChild(layer_elem)
      console.log('Found and tried to remove ', layer_elem)
    }
  }
  mei_clone = _remove_empty_xmlns(mei_clone)
  var saved = new XMLSerializer().serializeToString(mei_clone)
  downloadAs(saved, filename + '.mei', 'text/xml')
}

export function save_txt() {
  var mei_clone = mei.cloneNode(true)
  mei_clone = _remove_empty_xmlns(mei_clone)

  const mei_walker = mei_clone.createTreeWalker(
    mei_clone,
    NodeFilter.SHOW_ALL,
    null,
    false
  )

  let saved = ''
  let mei_node = Object.create(NamedNodeMap)

  while (mei_node = mei_walker.nextNode()) {
    if (mei_node.tagName && ['node', 'note', 'arc'].includes(mei_node.tagName)) {

      const attributes = Object.fromEntries(
        Array.from(mei_node.attributes).map(attr => [attr.name, attr.value]))
      
      if (Object.keys(attributes).length > 0) {
        const mei_node_dict = {
          tagName: mei_node.tagName,
          attributes: attributes
        }
        
        if (mei_node.tagName == 'note') {
          mei_node_dict.tagName = 'mei_note'
        }
        
        if (mei_node.tagName == 'node' && attributes['type'] == 'relation') {
          do {
            mei_node = mei_walker.nextNode()
          } while (!mei_node.tagName || !['node', 'note', 'arc', 'label'].includes(mei_node.tagName))
          if (mei_node.tagName == 'label') {
            let label_attributes = Object.fromEntries(
              Array.from(mei_node.attributes).map(attr => [attr.name, attr.value]))
            let label = label_attributes['type']
            mei_node_dict.attributes.label = label
          } else {
            console.log('MEI to plaintext: Suspected parsing error! Check for lost graph content in text output.')
          }
        }

        if (mei_node.tagName == 'node' && !attributes['type']) {
          mei_node_dict.attributes['type'] = 'note'
          do {
            mei_node = mei_walker.nextNode()
          } while (!mei_node.tagName || mei_node.tagName != 'note')
          let note_attributes = Object.fromEntries(
            Array.from(mei_node.attributes).map(attr => [attr.name, attr.value]))
          if (mei_node.tagName == 'note' && note_attributes['corresp']) {
            mei_node_dict.attributes['corresp'] = note_attributes['corresp'].slice(1)
          } else {
            console.log('MEI to plaintext: Suspected parsing error! Check for lost graph content in text output.')
          }
        }
        
        if (mei_node.tagName == 'arc') {
          mei_node_dict.attributes['from'] = mei_node_dict.attributes['from'].slice(1)
          mei_node_dict.attributes['to'] = mei_node_dict.attributes['to'].slice(1)
        }

        saved += JSON.stringify(mei_node_dict, null, 4)
      }
    }
  }

  downloadAs(saved, filename + '.txt', 'text/plain')
}

const inlineStyles = element => {
  const styles = getComputedStyle(element)
  setAttributes(element, {
    'fill': styles.fill,
    'fill-opacity': styles.fillOpacity,
    'opacity': styles.opacity,
    'stroke': styles.stroke,
    'stroke-opacity': styles.strokeOpacity,
    'stroke-width': styles.strokeWidth,
  })
}

/**
 * Download the current SVG, including graph elements.
 *
 * Before saving the SVG, we need to style it by inlining presentation
 * attributes (fill, stroke, opacity…). To do that, we clone it and
 * add it in the spritesheet block. This way, it can inherit the
 * global CSS while remaining hidden (spritesheet is hidden).
 */
export function save_svg() {
  const svg = getCurrentDrawContext().svg_elem.children[0]

  // Append cloned SVG.
  const cloneSvgElement = svg.cloneNode(true)
  document.getElementById('svg-spreadsheet').append(cloneSvgElement)

  // Inline its relations and metarelations styles (it includes graphs).
  const relations = cloneSvgElement.getElementsByClassName('relation')
  const metarelations = cloneSvgElement.getElementsByClassName('metarelation')
  Array.from(relations).forEach(inlineStyles)
  Array.from(metarelations).forEach(inlineStyles)

  // Remove bookmarks.
  const bookmarks = cloneSvgElement.getElementsByClassName('bookmark')
  Array.from(bookmarks).forEach(bookmark => bookmark.remove())

  // Remove circle:id attributes, as they do not belong in the namespace and may cause parsing errors.
  cloneSvgElement.querySelectorAll('[circle\\:id]').forEach(el => {
    el.removeAttribute('circle:id')
  })

  // Get SVG string and remove the clone from the DOM.
  const cloneSvgStr = new XMLSerializer().serializeToString(cloneSvgElement)
  cloneSvgElement.remove()

  downloadAs(cloneSvgStr, filename + '.svg', 'text/xml')
}

// Load a new MEI
export function load(event) {
  console.debug('Using globals: selected_extraselected, upload, reader, filename')

  const files = event.target.files

  /* Cancel loading if changes are not saved? alert */
  selected = []
  extraselected = []
  mei = ''
  window.relationTreeInstance = null

  if (files.length == 1) {
    reader.onload = function (e) {
      data = reader.result
      load_finish()
    }
    reader.readAsText(files[0])

    /**
     * move this to the MAIN MENU
     */
    filename = files[0].name.split('.').slice(0, -1).join('.')
    if (filename == '') filename = files[0].name

    // Update page title and menu filename
    document.title = `${filename}`
    document.getElementById('menu-filename').textContent = filename
  }
}

// Draw the existing graph
export function draw_graph(draw_context) {
  console.debug('Using globals: mei_graph, mei, selected, extraselected, document')

  let ctxt = getDrawContexts().find(c => c.canEdit)

  let reduced_svg_el = Array.from(
    ctxt
      .view_elem
      .getElementsByClassName('hidden-reduced')
  )
  let reduced_svg_el_ids = reduced_svg_el.map(get_id)

  // There's a multi-stage process to get all the info we
  // need... First we get the nodes from the graph MEI element.
  var all_mei_nodes = Array.from(mei_graph.getElementsByTagName('node'))
  // Get the MEI nodes representing non-hidden (not reduced) relations
  var visible_mei_rel_nodes = all_mei_nodes.filter((x) => {
    if (x.getAttribute('type') != 'relation') return false
    let is_visible_rel = reduced_svg_el_ids
      ? !reduced_svg_el_ids.includes(id_in_svg(ctxt, get_id(x)))
      : true
    return is_visible_rel
  })
  // Get the nodes representing metarelations
  var metarelations_nodes = all_mei_nodes.filter((x) => { return x.getAttribute('type') == 'metarelation' })

  // Remove any already drawn relations and meta-relations from the SVG so they will not be duplicated.
  $(draw_context.view_elem).find('.relation').not('.hidden-reduced').remove()
  $(draw_context.view_elem).find('.metarelation').not('.hidden-reduced').remove()

  // Verify that no relations contain duplicate notes, otherwise alert the user.
  visible_mei_rel_nodes.forEach((g_elem) => {
    let nodes = relation_get_notes(g_elem)
    for (let i in nodes) {
      for (let j in nodes) {
        if (nodes[i].isSameNode(nodes[j]) && i !== j) {
          alert(`Graph error: Multiple instances of note ${nodes[i].getAttribute('xml:id')} found in relation ${g_elem.getAttribute('xml:id')}.\n\nAttempting to continue drawing, although the graph plot is likely to be inconsistent.`)
          return false
        }
      }
    }
    let d = draw_relation(draw_context, mei_graph, g_elem)
    if (d)
      mark_secondaries(draw_context, mei_graph, g_elem)
  })
  metarelations_nodes.forEach((g_elem) => draw_metarelation(draw_context, mei_graph, g_elem))
}

// Do all of this when we have the MEI in memory
function load_finish() {
  console.debug('Using globals data, parser, mei, jquery document, document, midi, changes, undo_cations, redo_actions, reduce_actions, rerendered_after_action')

  // Parse the original document
  var parser = new DOMParser()
  try {
    mei = parser.parseFromString(data, 'text/xml')
    if (mei.getElementsByTagName('parsererror').length > 0) {
      console.log('This is not a valid XML or MEI file. However it could be ABC or Humdrum, for instance')
    }
  } catch {
    console.log('This is not a valid XML or MEI file. However it could be ABC or Humdrum, for instance')
    return false
  }

  vrvToolkit = new verovio.toolkit()
  if (mei.documentElement.namespaceURI != 'http://www.music-encoding.org/ns/mei') {
    // We didn't get a MEI? Try if it's a musicXML
    try {
      let new_svg = vrvToolkit.renderData(data, { pageWidth: 20000,
        pageHeight: 10000, breaks: 'none' })
    } catch {
      if (!new_svg) {
        console.log('Verovio could not generate SVG from non-MEI file.')
        return false
      }
    }
    // TODO: Detect failure and bail
    data = vrvToolkit.getMEI()
    parser = new DOMParser()
    try {
      mei = parser.parseFromString(data, 'text/xml')
    } catch {
      alert('Cannot parse this XML file as valid MEI.')
      return false
    }
  } else {
    // We got a MEI, it could be from a previous version of the app, so we
    // should fix previous, now deprecated practises, if present.
    fix_synonyms(mei)
    fix_corresp(mei.children[0])
    fix_layers(mei)
  }

  try {
    mei_graph = add_or_fetch_graph()
  } catch {
    alert('Cannot parse this XML file as valid MEI.')
    // loader_modal.close()
    return false
  }

  // Clear the old (if any)
  draw_contexts = []
  layer_contexts = []
  document.getElementById('layers').innerHTML = ''

  draw_contexts.hullPadding = 200
  draw_contexts.curvatureFactor = 0.5

  // Segment existing layers
  var layers = Array.from(
    mei
      .getElementsByTagName('body')[0]
      .getElementsByTagName('mdiv')
  )
  for (let i in layers) {
    let mdiv_elem = layers[i]
    let score_elem = mdiv_elem.children[0]
    let new_mei = mei_for_layer(mei, mdiv_elem)
    let [_new_data, new_svg] = render_mei(new_mei)
    if (!new_svg) {
      console.log('Verovio could not generate SVG from MEI.')
      return false
    }

    var layer_element = new_layer_element()

    if (i != 0) {
      let prefix = mdiv_elem.getAttribute('xml:id')
    }

    var [view_element, svg_element] = new_view_elements(layer_element)
    svg_element.innerHTML = new_svg

    var layer_context = {
      mei: new_mei,
      layer_elem: layer_element,
      score_elem: score_elem,
      id_mapping: get_id_pairs(mdiv_elem),
      number_of_views: 1
    }

    const isFirstLayer = i == 0

    layer_contexts.push(layer_context)
    var draw_context = {
      // TODO: One draw context per existing score element
      // already on load.

      mei_mdiv: mdiv_elem,
      svg_elem: svg_element,
      view_elem: view_element,
      layer: layer_context,
      distance_from_surface: 0,
      id_prefix: '',
      reductions: [],

      // first layer is always saved and never editable
      forceSaveLayer: isFirstLayer,

      // by default, all layers are saved and editable, but the first isn't editable
      canSave: true,
      canEdit: isFirstLayer,
    }

    if (isFirstLayer) {
      midi = vrvToolkit.renderToMIDI()
      orig_midi = midi
    } else
      draw_context.id_prefix = draw_contexts.length

    finalize_draw_context(draw_context)
  }

  undo_actions = []
  redo_actions = []

  rerendered_after_action = 0

  newApp.ui.bookmarks.init()
  newApp.ui.layersMenu.setDataPosition()

  document.onkeypress = function(ev) { handle_keypress(ev) }
  document.onkeydown = handle_keydown
  document.onkeyup = handle_keyup
  document.getElementById('layers').onclick = handle_click

  document.dispatchEvent(new Event('scoreload'))

  // Install drag-select controller.
  drag_selector_installer()

  for (let context of getDrawContexts()) {
    newApp
      .ui
      .zoom
      .initSvg(
        context
          .svg_elem
          .getElementsByTagName('svg')[0]
          .getElementsByClassName('definition-scale')[0]
      )
  }

  return true
}

export function rerender_mei(replace_with_rests = false, draw_context = draw_contexts[0]) {
  var mei2 = mei_for_layer(mei, draw_context.mei_mdiv)

  Array.from(mei2.getElementsByTagName('note')).forEach((n) => {
    let x = document.getElementById(id_in_svg(draw_context, get_id(n)))
    if (!x || x.classList.contains('hidden')) {
      // TODO: this is wrong
      //
      var paren = n.parentNode
      // TODO: deal properly with tremolos
      // TODO
      if (replace_with_rests && !['chord', 'bTrem', 'fTrem'].includes(paren.tagName)) {
        // Add a rest
        var rest = note_to_rest(mei2, n)
        paren.insertBefore(rest, n)
      }
      paren.removeChild(n)
    }
  })
  Array.from(mei2.getElementsByTagName('chord')).forEach((x) => {
    if (x.getElementsByTagName('note').length == 0) {
      x.parentNode.removeChild(x)
    }
  })

  return mei2

}

/**
 * Deletes a layer from the MEI and removes it from the UI
 *
 * @param {Object} draw_context - The draw context representing the layer to delete
 * @returns {boolean} - True if the layer was successfully deleted, false otherwise
 */
export function delete_layer(draw_context) {
  // Check if the layer can be edited
  if (!draw_context || draw_context.canEdit) {
    alert('This layer cannot be deleted')
    return false
  }

  // Ask for confirmation since this action is irreversible
  if (!confirm('Warning: Deleting a layer is irreversible and cannot be undone. Continue?')) {
    return false
  }

  try {
    // 1. Delete the layer from the MEI document
    const mdiv_elem = draw_context.mei_mdiv
    const mdiv_id = mdiv_elem.getAttribute('xml:id')
    const mdiv_in_mei = get_by_id(mei, mdiv_id)

    if (mdiv_in_mei) {
      mdiv_in_mei.parentElement.removeChild(mdiv_in_mei)
    }

    // 2. Remove the layer div from HTML
    const layer_elem = draw_context.layer.layer_elem
    if (layer_elem) {
      layer_elem.parentElement.removeChild(layer_elem)
    }

    // 3. Remove the layer from our data structures
    draw_contexts = draw_contexts.filter(ctx => ctx !== draw_context)
    layer_contexts = layer_contexts.filter(ctx => ctx !== draw_context.layer)

    // 4. Set the current draw context to the first layer
    setCurrentDrawContext(draw_contexts[0])

    return true
  } catch (error) {
    console.error('Error deleting layer:', error)
    return false
  }
}

export function create_new_layer(sliced = false, tied = false) {

  const draw_context = getDrawContexts().find(e => e.canEdit)

  var new_mdiv_elem
  if (sliced)
    new_mdiv_elem = new_sliced_layer(draw_context, tied)
  else
    new_mdiv_elem = new_layer(draw_context)
  let new_score_elem = new_mdiv_elem.children[0]
  let new_mei = mei_for_layer(mei, new_mdiv_elem)
  var [_new_data, new_svg] = render_mei(new_mei)
  if (!new_svg) {
    console.log('Verovio could not generate SVG from MEI.')
    return false
  }

  var layer_element = new_layer_element()

  let prefix = new_mdiv_elem.getAttribute('xml:id')

  var [new_view_elem, new_svg_elem] = new_view_elements(layer_element)

  new_svg_elem.innerHTML = new_svg

  var layer_context = {
    mei: new_mei,
    layer_elem: layer_element,
    score_elem: new_score_elem,
    id_mapping: get_id_pairs(new_mdiv_elem),
    number_of_views: 1,
  }
  layer_contexts.push(layer_context)
  var new_draw_context = {
    mei_mdiv: new_mdiv_elem,
    svg_elem: new_svg_elem,
    view_elem: new_view_elem,
    layer: layer_context,
    id_prefix: '',
    reductions: [],

    forceSaveLayer: false,
    canSave: true,
    canEdit: false,
  }

  // prefix_draw_context(new_draw_context);
  new_draw_context.id_prefix = draw_contexts.length
  finalize_draw_context(new_draw_context)

  // Replicating the source layer's settings
  let newSvgCont = new_draw_context.svg_elem
  let oldSvgCont = draw_context.svg_elem

  let newRootSvg = newSvgCont.getElementsByTagName('svg')[0]
  let oldRootSvg = oldSvgCont.getElementsByTagName('svg')[0]

  newRootSvg
    .getElementsByClassName('definition-scale')[0]
    .setAttribute('viewBox',
      oldRootSvg
        .getElementsByClassName('definition-scale')[0]
        .getAttribute('viewBox'))

  newSvgCont.style.width = oldSvgCont.style.width
  newSvgCont.style.height = oldSvgCont.style.height

  newApp.ui.zoom.initSvg(
    newSvgCont
      .getElementsByTagName('svg')[0]
      .getElementsByClassName('definition-scale')[0]
  )

  newApp.ui.zoom.setScale(newApp.ui.zoom.state.scale)

  return new_draw_context
}

function finalize_draw_context(new_draw_context) {
  new_draw_context.measure_map = compute_measure_map(new_draw_context)
  draw_contexts.reverse()
  draw_contexts.push(new_draw_context)
  draw_contexts.reverse()
  for (let n of new_draw_context.svg_elem.getElementsByClassName('note')) {
    n.onclick = () => toggle_selected(n)
  }
  for (let s of new_draw_context.svg_elem.getElementsByClassName('staff')) {
    // TODO: handle staves with no notes in them
    let [y_to_p, p_to_y] = pitch_grid(s)
    s.y_to_p = y_to_p
    s.p_to_y = p_to_y
  }
  draw_graph(new_draw_context)
  setCurrentDrawContext(new_draw_context)
  adjustAllLayersSvgDimensions()
}

function render_mei(mei) {
  var data = new XMLSerializer().serializeToString(sanitize_xml(mei))

  var svg = vrvToolkit.renderData(data, {
    scale: 50,
    footer: 'none',
    header: 'none',
    breaks: 'none',
    svgCss: 'g.notehead, g.stem, g.dots {fill: currentColor;}',
  })
  return [data, svg]
}

console.log('Main webapp library is loaded')

export const getDrawContexts = () => draw_contexts
export const getMeiGraph = () => mei_graph
export const getOrigMidi = () => orig_midi
export const getVerovioToolkit = () => vrvToolkit
export const getData = () => data
export const getUndoActions = () => undo_actions
export const getRedoActions = () => redo_actions
export const setRedoActions = (value) => redo_actions = value
export const getRerenderedAferAction = () => rerendered_after_action
