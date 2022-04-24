import $ from 'jquery'
import pagemap from 'pagemap'
import DragSelect from 'dragselect'

import newApp from './new/app'
import {
  action_conf,
  custom_conf,
  combo_conf,
  hide_classes,
  meta_conf,
  type_conf,
  navigation_conf,
} from './conf'

import {
  do_relation,
  do_comborelation,
  do_metarelation,
  getMeiGraph,
  draw_graph,
  rerender_mei,
  getVerovioToolkit,
  getData,
  getDrawContexts,
} from './app'

import { do_reduce_pre } from './reductions'
import { draw_hierarchy_graph } from './visualizations'

import { do_copy, do_paste }  from './copy_paste'

import {
  flip_to_bg,
  get_class_from_classlist,
  select_samenote,
  unmark_secondaries
} from './utils'

import {
  place_note,
  update_placing_note
} from './coordinates'

import { delete_relations } from './delete'
import { do_redo, do_undo } from './undo_redo'
import { isFieldFocused } from './new/utils/forms'
import { rootStyles } from './new/utils/document'
import { metaRelationTypes, relationTypes } from './new/modules/Relations/config'

/* UI globals */

var non_notes_hidden = false

// Hovering and adding notes
var placing_note = ''

var current_draw_context

var mouseX
var mouseY

export const getMouseX = () => mouseX
export const getMouseY = () => mouseY

// Last-selected entity in the current selection.
var last_selected = null

// Show non-related ("orphan") notes by default.
var show_orphans = true

// Toggle if a thing (for now: note or relation) is selected or not.
export function toggle_selected(item, extra = null) {
  const itemType = get_class_from_classlist(item)

  if (!['relation', 'metarelation', 'note'].includes(itemType)) {
    return
  }

  const flatSelection = selected.concat(extraselected)

  /**
   * Make sure selection happens in the same layer, restricted to same type of
   * selected items for now. Editing relations to add things means deleting
   * and re-adding.
   */
  if (flatSelection.length > 0) {
    const selectionType = get_class_from_classlist(flatSelection[0])
    const selectionScoreContainer = flatSelection[0].closest('.svg_container')
    const itemScoreContainer = item.closest('.svg_container')
    if (itemType != selectionType || itemScoreContainer != selectionScoreContainer) {
      return
    }
  }

  const isAlreadySelected = flatSelection.find(el => el == item)

  // Unselect and remove from selection arrays

  if (isAlreadySelected) {
    item.classList.remove(
      'selectednote', 'extraselectednote',
      'selectedrelation', 'extraselectedrelation'
    )

    selected = selected.filter(x => x !== item)
    extraselected = extraselected.filter(x => x !== item)
  }

  /**
   * Unless it’s explicitely forced (= when `extra` is `true` or `false`), the
   * selection mode is handled by a keyboard shortcut or the visual toggle.
   */
  if (extra === null) {
    extra = newApp.ui.selection.mode.mode == 'primary'
  }

  // Select note.

  if (itemType == 'note' && !isAlreadySelected) {
    if (extra) {
      item.classList.add('extraselectednote')
      extraselected.push(item)
    } else {
      item.classList.add('selectednote')
      selected.push(item)
    }
    last_selected = item
  }

  // Select relation.

  if (itemType == 'relation' || itemType == 'metarelation') {
    if (!isAlreadySelected) {
      if (extra) {
        item.classList.add('extraselectedrelation')
        extraselected.push(item)
      } else {
        item.classList.add('selectedrelation')
        selected.push(item)
      }
      last_selected = item
    }
    if (selected.concat(extraselected).length == 0) {
      last_selected = null
    }
  }

  // Dispatch selection changes.

  const selection = {
    selected: selected,
    extraselected: extraselected,
  }

  document.dispatchEvent(new CustomEvent('scoreselection', {
    detail: {
      selection,
      lastSelected: last_selected,
    },
  }))
}

export function select_visibles(draw_context) {
  // Find all non-filtered relationships in the draw context.
  var visibles = Array.from(draw_context.svg_elem.getElementsByClassName('relation')).filter(n => !n.classList.contains('relation--filtered'))

  // Clear out any selections in other contexts.
  if (visibles.length > 0) {
    var ci = get_class_from_classlist(visibles[0])
    var cd = visibles[0].closest('div')
    if (selected.length > 0 || extraselected.length > 0) {
      var csel = get_class_from_classlist(selected.concat(extraselected)[0])
      var cdsel = selected.concat(extraselected)[0].closest('div')
      // Select only things of the same type for now - editing
      // relations to add things means deleting and re-adding
      if (csel != 'relation')
        do_deselect()
      if (cd != cdsel)
        do_deselect()
    }

    // Add all visible yet still unselected relations to selection list.
    visibles.forEach(n => { if (!n.classList.contains('selectedrelation')) toggle_selected(n) })
  }
}

/* Keypress/mouse handler functions */

window.onmousemove = (e) => {
  mouseX = e.clientX
  mouseY = e.clientY

  if (placing_note != '') {
    update_placing_note()
  }
}

export function handle_keydown(ev) {

  // Global `.shift-pressed` class for pretty (meta-)relation styling on hover.
  if (ev.key === 'Shift')
    $('#layers').addClass('shift-pressed')
}

export function handle_keyup(ev) {

  // Global `.shift-pressed` class for pretty (meta-)relation styling on hover.
  if (ev.key === 'Shift')
    $('#layers').removeClass('shift-pressed')
}

export function handle_click(ev) {
  place_note()
}

// We have keyboard commands!
export function handle_keypress(ev) {
  var e;

  if (isFieldFocused()) { return }

  if (ev.key == 'Enter') {
    // do_edges()
  } else if (ev.key == action_conf.move_relation_to_front) { // Scroll through relations
    var elem = document.elementFromPoint(mouseX, mouseY)
    if (elem.tagName == 'circle')
      elem = elem.closest('g')
    flip_to_bg(elem)
    if (elem.onmouseout) elem.onmouseout()
  } else if (ev.key == action_conf.undo) { // UNDO
    do_undo()
  } else if (ev.key == action_conf.redo) { // UNDO
    do_redo()
  } else if (ev.key == action_conf.copy) { // COPY
    do_copy()
  } else if (ev.key == action_conf.paste) { // PASTE
    do_paste()
  } else if (ev.key == action_conf.reduce_relations) { // Reduce relations
    do_reduce_pre(current_draw_context)
  } else if (ev.key == action_conf.select_same_notes) { // Select same notes in the measure
    select_samenote()
    do_relation('repeat')
  } else if (ev.key == action_conf.deselect_all) { // Deselect all.
    do_deselect()
  } else if (ev.key == action_conf.delete_all) { // Delete relations.
    delete_relations()
  } else if (ev.key == action_conf.add_bookmark) { // Add bookmark.
    add_bookmark()
  } else if (ev.key == custom_conf.relation) { // Custom relations.
    ev.preventDefault()
    var was_collapsed = $('#relations_panel').hasClass('collapsed')
    if (was_collapsed) toggle_buttons()
    // $('#custom_type').select2('open')
  } else if (ev.key == custom_conf.meta_relation) { // Custom meta-relations.
    ev.preventDefault()
    var was_collapsed = $('#relations_panel').hasClass('collapsed')
    if (was_collapsed) toggle_buttons()
    // $('#meta_custom_type').select2('open')
  } else if (e = Object.entries(type_conf).find((c) => c[1].key == ev.key)) { // Add a relation
    do_relation(e[0])
  } else if (e = Object.entries(meta_conf).find((c) => c[1].key == ev.key)) { // Add a metarelation
    do_metarelation(e[0])
  } else if (e = Object.entries(combo_conf).find((c) => c[1].key == ev.key)) { // Add a comborelation
    do_comborelation(e[0])
  } else if (ev.key == navigation_conf.toggle_palette) { // Toggle the relations palette
    toggle_buttons()
  } else {
    console.log(ev)
  }
}

/* Large-ish UI functions */

// Toggle showing things other than notes in the score
export function toggle_equalize() {
  console.debug('Using globals: non_notes_hidden')
  non_notes_hidden = !non_notes_hidden
  set_non_note_visibility(non_notes_hidden)
  if (!non_notes_hidden) show_all_notes()
}

function set_non_note_visibility(hidden) {
  console.debug('Using globals: document for element selection')

  Array.from(document.getElementsByClassName('beam')).forEach(x => Array.from(x.children)
    .filter(x => x.tagName == 'polygon')
    .forEach(x => x.classList.toggle('hidden', hidden)))

  hide_classes.forEach(cl =>
    Array.from(document.getElementsByClassName(cl))
      .forEach(x => x.classList.toggle('hidden', hidden))
  )
}

/**
 * Toggle the current relation having a type-dependent shade.
 *
 * Ideas to evaluate for improvements:
 * 1) gather colors in one object so that
 *    `rootStyles.getPropertyValue(`--relation-${colorIndex}`)` isn’t needed.
 * 2) Do `element.setAttribute('color', color)` on relation creation,
 *    maybe in `draw_relation()` after elem.setAttribute('type', type).
 */
export function toggle_shade(element) {
  const type = element.getAttribute('type')
  const isRelation = element.classList.contains('relation')
  const config = isRelation ? relationTypes : metaRelationTypes
  const colorIndex = config.main[type]?.color ?? 0

  const color = rootStyles.getPropertyValue(`--relation-${colorIndex}`)
  element.setAttribute('color', color)
}

/* Small UI functions */

export function do_deselect() {
  selected.forEach(x => toggle_selected(x, false))
  extraselected.forEach(x => toggle_selected(x, true))
}

export function getReducedMidi(draw_context = null) {
  if (!draw_context) {
    draw_context = getDrawContexts()[0]
  }
  var vrvToolkit = getVerovioToolkit()
  var mei2 = rerender_mei(true, draw_context)
  var data2 = new XMLSerializer().serializeToString(mei2)
  vrvToolkit.loadData(data2)
  const midi = vrvToolkit.renderToMIDI()
  var data = getData()
  vrvToolkit.loadData(data)
  return midi
}

export function handle_hull_controller(value) {
  var mei_graph = getMeiGraph()
  var draw_contexts = getDrawContexts()
  do_deselect()
  $('.relation').remove()
  $('.metarelation').remove()
  var nodes_array = Array.from(mei_graph.getElementsByTagName('node'))
  var relations_nodes = nodes_array.filter(x => x.getAttribute('type') == 'relation')
  var metarelations_nodes = nodes_array.filter(x => x.getAttribute('type') == 'metarelation')
  draw_contexts.forEach(draw_context => {
    relations_nodes.forEach(
      g_elem => unmark_secondaries(draw_context, mei_graph, g_elem)
    )
  })
  draw_contexts.hullPadding = value
  draw_contexts.forEach(draw_graph)

  // update hierarchy trees
  draw_contexts.forEach(context => {
    if (context.svg_elem.getRootNode().getElementById('hier' + context.id_prefix))
      draw_hierarchy_graph(context)
  })
}

export function drag_selector_installer(svg_elem) {
  // See https://github.com/ThibaultJanBeyer/DragSelect for API documentation.

  window.drag_selector = new DragSelect({
    selectables: document.getElementsByClassName('relation'),
    area: $('#layers')[0],
    draggability: false,
    overflowTolerance: { x: 1, y: 1 },
    autoScrollSpeed: 0.0001
  })

  drag_selector.subscribe('dragstart', ({ items, event, isDragging }) => {
    $('.ds-selector-area').show()
  })

  drag_selector.subscribe('dragmove', ({ items, event, isDragging }) => {
    // Do not drag-select if a note is being added or the minimap used.
    if (
      placing_note == ''
      &&
      !document.getElementById('minimap').classList.contains('dragging')
    ) {
      if ($('.ds-selector').height() > 10 || $('.ds-selector').width() > 10) {
        $('#minimap').fadeOut(300)
        // Icon credit: pixel-perfect (flaticon.com).
        document.getElementById('layers').style.cursor = 'url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMjJwdCIgaGVpZ2h0PSIyMnB0IiB2aWV3Qm94PSIwIDAgMjIgMjIiIHZlcnNpb249IjEuMSI+CjxnIGlkPSJzdXJmYWNlMSI+CjxwYXRoIHN0eWxlPSIgc3Ryb2tlOm5vbmU7ZmlsbC1ydWxlOm5vbnplcm87ZmlsbDpyZ2IoMCUsMCUsMCUpO2ZpbGwtb3BhY2l0eToxOyIgZD0iTSA0LjQ0OTIxOSAxNC44MDA3ODEgQyA0LjI2OTUzMSAxNC42MjEwOTQgMy45ODA0NjkgMTQuNjIxMDk0IDMuODAwNzgxIDE0LjgwMDc4MSBDIDMuNjIxMDk0IDE0Ljk4MDQ2OSAzLjYyMTA5NCAxNS4yNjk1MzEgMy44MDA3ODEgMTUuNDQ5MjE5IEMgNS43Njk1MzEgMTcuNDE3OTY5IDUuNzY5NTMxIDE5LjI1IDMuODAwNzgxIDIxLjIxODc1IEMgMy42MjEwOTQgMjEuMzk4NDM4IDMuNjIxMDk0IDIxLjY4NzUgMy44MDA3ODEgMjEuODY3MTg4IEMgMy44OTA2MjUgMjEuOTU3MDMxIDQuMDA3ODEyIDIyIDQuMTI1IDIyIEMgNC4yNDIxODggMjIgNC4zNTkzNzUgMjEuOTU3MDMxIDQuNDQ5MjE5IDIxLjg2NzE4OCBDIDYuNzU3ODEyIDE5LjU1NDY4OCA2Ljc1NzgxMiAxNy4xMTMyODEgNC40NDkyMTkgMTQuODAwNzgxIFogTSA0LjQ0OTIxOSAxNC44MDA3ODEgIi8+CjxwYXRoIHN0eWxlPSIgc3Ryb2tlOm5vbmU7ZmlsbC1ydWxlOm5vbnplcm87ZmlsbDpyZ2IoMCUsMCUsMCUpO2ZpbGwtb3BhY2l0eToxOyIgZD0iTSA0LjEyNSAxMS45MTc5NjkgQyAzLjExMzI4MSAxMS45MTc5NjkgMi4yOTI5NjkgMTIuNzM4MjgxIDIuMjkyOTY5IDEzLjc1IEMgMi4yOTI5NjkgMTQuNzYxNzE5IDMuMTEzMjgxIDE1LjU4MjAzMSA0LjEyNSAxNS41ODIwMzEgQyA1LjEzNjcxOSAxNS41ODIwMzEgNS45NTcwMzEgMTQuNzYxNzE5IDUuOTU3MDMxIDEzLjc1IEMgNS45NTcwMzEgMTIuNzM4MjgxIDUuMTM2NzE5IDExLjkxNzk2OSA0LjEyNSAxMS45MTc5NjkgWiBNIDQuMTI1IDE0LjY2Nzk2OSBDIDMuNjIxMDk0IDE0LjY2Nzk2OSAzLjIwNzAzMSAxNC4yNTM5MDYgMy4yMDcwMzEgMTMuNzUgQyAzLjIwNzAzMSAxMy4yNDYwOTQgMy42MjEwOTQgMTIuODMyMDMxIDQuMTI1IDEyLjgzMjAzMSBDIDQuNjI4OTA2IDEyLjgzMjAzMSA1LjA0Mjk2OSAxMy4yNDYwOTQgNS4wNDI5NjkgMTMuNzUgQyA1LjA0Mjk2OSAxNC4yNTM5MDYgNC42Mjg5MDYgMTQuNjY3OTY5IDQuMTI1IDE0LjY2Nzk2OSBaIE0gNC4xMjUgMTQuNjY3OTY5ICIvPgo8cGF0aCBzdHlsZT0iIHN0cm9rZTpub25lO2ZpbGwtcnVsZTpub256ZXJvO2ZpbGw6cmdiKDAlLDAlLDAlKTtmaWxsLW9wYWNpdHk6MTsiIGQ9Ik0gMjEuNzY1NjI1IDEzLjgwODU5NCBMIDEzLjUxNTYyNSA5LjIyMjY1NiBDIDEzLjM0Mzc1IDkuMTI4OTA2IDEzLjEzNjcxOSA5LjE1MjM0NCAxMi45ODgyODEgOS4yODEyNSBDIDEyLjg0Mzc1IDkuNDEwMTU2IDEyLjc5Mjk2OSA5LjYxMzI4MSAxMi44NjcxODggOS43OTY4NzUgTCAxNi41MzEyNSAxOC45NjA5MzggQyAxNi42MDE1NjIgMTkuMTMyODEyIDE2Ljc2OTUzMSAxOS4yNSAxNi45NTMxMjUgMTkuMjUgQyAxNi45NTMxMjUgMTkuMjUgMTYuOTU3MDMxIDE5LjI1IDE2Ljk1NzAzMSAxOS4yNSBDIDE3LjE0MDYyNSAxOS4yNSAxNy4zMDg1OTQgMTkuMTQwNjI1IDE3LjM3ODkwNiAxOC45NzI2NTYgTCAxOC42ODM1OTQgMTUuOTMzNTk0IEwgMjEuNzIyNjU2IDE0LjYyODkwNiBDIDIxLjg4MjgxMiAxNC41NjI1IDIxLjk4ODI4MSAxNC40MDYyNSAyMiAxNC4yMzA0NjkgQyAyMi4wMDc4MTIgMTQuMDU4NTk0IDIxLjkxNzk2OSAxMy44OTQ1MzEgMjEuNzY1NjI1IDEzLjgwODU5NCBaIE0gMjEuNzY1NjI1IDEzLjgwODU5NCAiLz4KPHBhdGggc3R5bGU9IiBzdHJva2U6bm9uZTtmaWxsLXJ1bGU6bm9uemVybztmaWxsOnJnYigwJSwwJSwwJSk7ZmlsbC1vcGFjaXR5OjE7IiBkPSJNIDUuNjY0MDYyIDEyLjc2NTYyNSBDIDUuNTc4MTI1IDEyLjYyODkwNiA1LjQ3MjY1NiAxMi41MDc4MTIgNS4zNTU0NjkgMTIuNDAyMzQ0IEMgNS4zMzk4NDQgMTIuMzg2NzE5IDUuMzI0MjE5IDEyLjM3NSA1LjMwODU5NCAxMi4zNjMyODEgQyA1LjIxMDkzOCAxMi4yNzczNDQgNS4xMDU0NjkgMTIuMjA3MDMxIDQuOTkyMTg4IDEyLjE0NDUzMSBDIDQuOTYwOTM4IDEyLjEyODkwNiA0LjkyOTY4OCAxMi4xMDkzNzUgNC44OTg0MzggMTIuMDkzNzUgQyA0Ljc3MzQzOCAxMi4wMzUxNTYgNC42NDQ1MzEgMTEuOTg4MjgxIDQuNTA3ODEyIDExLjk1NzAzMSBDIDQuNDY4NzUgMTEuOTQ5MjE5IDQuNDI1NzgxIDExLjk0OTIxOSA0LjM4MjgxMiAxMS45NDE0MDYgQyA0LjI2OTUzMSAxMS45MjU3ODEgNC4xNTIzNDQgMTEuOTE3OTY5IDQuMDM5MDYyIDExLjkyNTc4MSBDIDMuNjMyODEyIDExLjk0NTMxMiAzLjI2NTYyNSAxMi4wOTc2NTYgMi45Njg3NSAxMi4zMzU5MzggQyAzLjE5MTQwNiAxMi40OTYwOTQgMy40MTQwNjIgMTIuNjQ4NDM4IDMuNjU2MjUgMTIuNzkyOTY5IEMgMy43NSAxMi44NDc2NTYgMy44NTkzNzUgMTIuODY3MTg4IDMuOTY4NzUgMTIuODUxNTYyIEMgNC4zNDc2NTYgMTIuNzg1MTU2IDQuNzUzOTA2IDEyLjk3NjU2MiA0LjkzNzUgMTMuMzM1OTM4IEMgNC45ODgyODEgMTMuNDMzNTk0IDUuMDcwMzEyIDEzLjUxMTcxOSA1LjE2Nzk2OSAxMy41NTA3ODEgQyA1LjQyMTg3NSAxMy42NTYyNSA1LjY4NzUgMTMuNzM4MjgxIDUuOTQ5MjE5IDEzLjgyODEyNSBDIDUuOTQ5MjE5IDEzLjgwMDc4MSA1Ljk1NzAzMSAxMy43NzczNDQgNS45NTcwMzEgMTMuNzUgQyA1Ljk1NzAzMSAxMy4zODY3MTkgNS44NDc2NTYgMTMuMDUwNzgxIDUuNjY0MDYyIDEyLjc2NTYyNSBaIE0gNS42NjQwNjIgMTIuNzY1NjI1ICIvPgo8cGF0aCBzdHlsZT0iIHN0cm9rZTpub25lO2ZpbGwtcnVsZTpub256ZXJvO2ZpbGw6cmdiKDAlLDAlLDAlKTtmaWxsLW9wYWNpdHk6MTsiIGQ9Ik0gMTMuMzgyODEyIDEzLjU1ODU5NCBDIDExLjE5MTQwNiAxMy44OTg0MzggOC44NTkzNzUgMTMuNzUgNi44MDQ2ODggMTMuMTUyMzQ0IEMgNi44NDc2NTYgMTMuMzQzNzUgNi44NzUgMTMuNTQyOTY5IDYuODc1IDEzLjc1IEMgNi44NzUgMTMuODcxMDk0IDYuODU1NDY5IDEzLjk4ODI4MSA2LjgzOTg0NCAxNC4xMDkzNzUgQyA4LjE1NjI1IDE0LjQ2ODc1IDkuNTY2NDA2IDE0LjY2Nzk2OSAxMSAxNC42Njc5NjkgQyAxMS45MjU3ODEgMTQuNjY3OTY5IDEyLjgzOTg0NCAxNC41ODIwMzEgMTMuNzM0Mzc1IDE0LjQyOTY4OCBaIE0gMTMuMzgyODEyIDEzLjU1ODU5NCAiLz4KPHBhdGggc3R5bGU9IiBzdHJva2U6bm9uZTtmaWxsLXJ1bGU6bm9uemVybztmaWxsOnJnYigwJSwwJSwwJSk7ZmlsbC1vcGFjaXR5OjE7IiBkPSJNIDExIDAgQyA0LjkzMzU5NCAwIDAgMy4yODkwNjIgMCA3LjMzMjAzMSBDIDAgOC45NDE0MDYgMC44MDQ2ODggMTAuNDkyMTg4IDIuMjM4MjgxIDExLjc1NzgxMiBDIDIuNDY4NzUgMTEuNTM5MDYyIDIuNzM4MjgxIDExLjM1NTQ2OSAzLjAzNTE1NiAxMS4yMjY1NjIgQyAxLjY3OTY4OCAxMC4xMDkzNzUgMC45MTc5NjkgOC43MzgyODEgMC45MTc5NjkgNy4zMzIwMzEgQyAwLjkxNzk2OSAzLjc5Njg3NSA1LjQ0MTQwNiAwLjkxNzk2OSAxMSAwLjkxNzk2OSBDIDE2LjU1ODU5NCAwLjkxNzk2OSAyMS4wODIwMzEgMy43OTY4NzUgMjEuMDgyMDMxIDcuMzMyMDMxIEMgMjEuMDgyMDMxIDguNzUzOTA2IDIwLjM0Mzc1IDEwLjEwMTU2MiAxOC45ODgyODEgMTEuMjE4NzUgTCAxOS44Mzk4NDQgMTEuNjg3NSBDIDIxLjIyNjU2MiAxMC40Mzc1IDIyIDguOTEwMTU2IDIyIDcuMzMyMDMxIEMgMjIgMy4yODkwNjIgMTcuMDY2NDA2IDAgMTEgMCBaIE0gMTEgMCAiLz4KPC9nPgo8L3N2Zz4K), auto'
      }
      document.elementsFromPoint(mouseX, mouseY)
        .map(x => {
          switch (x.tagName) {
            case 'path':
              return x
            case 'use':
              return x.parentElement.parentElement
            case 'circle':
              return x.parentElement
            default:
              return false
          }
        })
        .filter(x => {
          if (typeof (x) == 'undefined' || typeof (x.classList) == 'undefined') return false
          var shiftKey = event.shiftKey
          return (x.classList.contains('relation') && !x.classList.contains('relation--filtered') && !x.classList.contains('selectedrelation') && !x.classList.contains('extraselectedrelation') && !shiftKey)
            || (x.classList.contains('note') && !x.classList.contains('selectednote') && !x.classList.contains('extraselectednote'))
            || (x.classList.contains('metarelation') && !x.classList.contains('selectedrelation') && !x.classList.contains('extraselectedrelation') && !shiftKey)
        })
        .forEach(toggle_selected)
    }
  })

  drag_selector.subscribe('callback', ({ items, event, isDragging }) => {
    document.getElementById('layers').style.cursor = 'default'
    $('.ds-selector-area').hide()
    $('#minimap').fadeIn(300)
  })
}

export function clear_top(draw_context) {
  var svg_elem = draw_context.svg_elem
  var id_prefix = draw_context.id_prefix
  var elem = svg_elem.getRootNode().getElementById('hier' + id_prefix)
  if (elem) {
    elem.parentNode.removeChild(elem)
    return true
  }
  elem = svg_elem.getRootNode().getElementById('tree' + id_prefix)
  if (elem) {
    elem.parentNode.removeChild(elem)
    return true
  }
  return false
}

export function adjust_top(draw_context, ydiff) {
  var svg_elem = draw_context.svg_elem
  var svg_height = svg_elem.children[0].getAttribute('height')
  var svg_viewbox = svg_elem.getElementsByClassName('definition-scale')[0].getAttribute('viewBox')
  var x, y, w, h

  if (!draw_context.old_viewbox) {
    [x, y, w, h] = svg_viewbox.split(' ')
    draw_context.old_viewbox = svg_viewbox
    draw_context.old_height = svg_height
  } else {
    [x, y, w, h] = draw_context.old_viewbox.split(' ')
    svg_height = draw_context.old_height
  }
  svg_elem.getElementsByClassName('definition-scale')[0].setAttribute('viewBox', [x, Number(y) - ydiff, w, Number(h) + ydiff].join(' '))

  var svg_num_height = Number(svg_height.split('p')[0]) // Assume "XYZpx"
  // change height
  svg_elem.children[0].setAttribute('height', (svg_num_height * ((h - (y - ydiff)) / (h - y))) + 'px')
}

export function hide_top(draw_context) {
  var svg_elem = draw_context.svg_elem
  var id_prefix = draw_context.id_prefix
  var something_to_clear = clear_top(draw_context)
  if (something_to_clear) {
    svg_elem.getElementsByClassName('definition-scale')[0].setAttribute('viewBox', draw_context.old_viewbox)
    svg_elem.children[0].setAttribute('height', draw_context.old_height)
  }
}

const minimapEl = document.getElementById('minimap')

export function minimap() {
  pagemap(minimapEl, {
    viewport: null,
    styles: {
      '.svg_container': 'rgba(0,0,0,0.30)',
      '.layer': 'rgba(0,0,0,0.00)'
    },
    back: 'rgba(0,0,0,0.30)',
    view: 'rgba(0,0,0,0.20)',
    drag: 'rgba(0,0,0,0.30)',
    interval: null
  })
}

function hide_orphan_notes() {
  var mei_graph = getMeiGraph()
  var ids = Array.from(document.getElementsByClassName('note')).map(e => e.id)
  var gn_ids = Array.from(mei_graph.getElementsByTagName('arc')).map(e => e.getAttribute('to'))
  ids.forEach(i => {
    var ii = i.replace(/(^\d+-?)/, '') // Replace layer or view prefixes.
    if (!gn_ids.includes(`#gn-${ii}`))
      document.getElementById(i).classList.add('hidden')
  })
}

function show_all_notes() {
  Array.from(document.querySelectorAll('g.note')).forEach(e => e.classList.remove('hidden'))
}

export function toggle_orphan_notes() {
  show_orphans = !show_orphans
  show_orphans ? show_all_notes() : hide_orphan_notes()
}

// Functions helping to interact with variable declared here from other files.
export const getPlacingNote = () => placing_note
export const setPlacingNote = value => placing_note = value

export const getCurrentDrawContext = () => current_draw_context
export const setCurrentDrawContext = drawContext => {
  current_draw_context?.layer.layer_elem.classList.remove('layer--active')
  current_draw_context = drawContext
  current_draw_context.layer.layer_elem.classList.add('layer--active')
}
