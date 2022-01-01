import { getMeiGraph } from './app'
import { getShades, toggle_selected, toggle_shade } from './ui'
import {
  add_to_svg_bg,
  average,
  circle,
  flip_to_bg,
  g,
  get_id,
  get_metarelation_target,
  id_in_svg,
  line,
  node_to_note_id,
  note_coords,
  relation_allnodes,
  relation_primaries,
  relation_secondaries,
  relation_type,
  roundedHull
} from './utils'

// Given a draw context and a graph node representing a relation, draw the
// relation in the draw context.
export function draw_relation(draw_context, mei_graph, g_elem) {
  var added = []
  // Where are we drawing, and with what prefix?
  var svg_elem = draw_context.svg_elem
  var id_prefix = draw_context.id_prefix
  // ID and type
  var id = id_prefix + g_elem.getAttribute('xml:id')
  var type = relation_type(g_elem)
  // What are the primary and secondary notes in the draw context?
  var primaries = relation_primaries(mei_graph, g_elem).map(
    (e) => document.getElementById(id_in_svg(draw_context, node_to_note_id(e)))
  )
  var secondaries = relation_secondaries(mei_graph, g_elem).map(
    (e) => document.getElementById(id_in_svg(draw_context, node_to_note_id(e)))
  )
  var notes = primaries.concat(secondaries)
  notes.sort((a, b) => {
    if (!a) return -1
    if (!b) return 1
    var p1 = note_coords(a)
    var p2 = note_coords(b)
    return (p1[0] - p2[0]) ? (p1[0] - p2[0]) : (p1[1] - p2[1])
  })
  // TODO: Should be able to draw relations that are not complete
  if (!notes[0]) {
    console.log('Note missing, relation not drawn')
    return null
  }

  // TODO: Other ways to draw the relations - retain as a single tree with
  // ID and type. TODO: Use classlist also for types, as in type:<type> or
  // similar
  var elem = roundedHull(notes.map(note_coords))
  elem.setAttribute('id', id)
  if (id_prefix != '')
    elem.setAttribute('oldid', g_elem.getAttribute('xml:id'))
  elem.classList.add('relation')
  elem.setAttribute('type', type)

  // Are we running with type-specific shades?
  if (getShades())
    toggle_shade(elem)

  // Relations can be scrolled
  elem.onwheel = (ev) => {
    var elem1 = ev.target
    flip_to_bg(elem1)
    elem.onmouseout()
    return false
  }

  function undraw_meta_or_relation(draw_context, g_elem) {
    let mei_id = get_id(g_elem)
    let svg_id = draw_context.id_prefix + mei_id
    let svg_he = get_by_id(document, svg_id)
    if (!svg_he) {
      console.debug('Could not undraw relation in draw context', g_elem, draw_context)
      return false
    }
    const mei_graph = getMeiGraph()
    if (g_elem.getAttribute('type') == 'relation')
      unmark_secondaries(draw_context, mei_graph, mei_he) // @todo: Where does mei_he come from?
    var primaries = relation_primaries(mei_graph, g_elem).map(
      (e) => document.getElementById(id_in_svg(draw_context, node_to_note_id(e)))
    )
    var secondaries = relation_secondaries(mei_graph, g_elem).map(
      (e) => document.getElementById(id_in_svg(draw_context, node_to_note_id(e)))
    )
    primaries.forEach((item) => { item.classList.remove('extrahover') })
    secondaries.forEach((item) => { item.classList.remove('selecthover') })
    svg_he.parentNode.removeChild(svg_he)
    return true
  }

  // Decorate with onclick and onmouseover handlers
  elem.onclick = () => toggle_selected(elem)
  elem.onmouseover = function () {
    primaries.forEach(item => item.classList.add('extrahover'))
    secondaries.forEach(item => item.classList.add('selecthover'))
  }
  elem.onmouseout = function () {
    primaries.forEach(item => item.classList.remove('extrahover'))
    secondaries.forEach(item => item.classList.remove('selecthover'))
  }
  // TODO: Set up more onhover stuff for The Same Relation
  // Elsewhere - but perhaps that's a separate thing?

  // Add it to the SVG
  add_to_svg_bg(svg_elem, elem)
  // Remember what we're adding
  added.push(elem)
  return added

}

function redraw_relation(draw_context, g_elem) {
  var svg_g_elem = get_by_id(document, id_in_svg(draw_context, get_id(g_elem)))
  if (!svg_g_elem) {
    console.log('Unable to redraw relation: ', g_elem, ' in draw context ', draw_context)
    return
  }
  unmark_secondaries(draw_context, mei_graph, g_elem)
  svg_g_elem.parentElement.removeChild(svg_g_elem)
  svg_g_elem = draw_relation(draw_context, mei_graph, g_elem)
  mark_secondaries(draw_context, mei_graph, g_elem)
  return svg_g_elem[0]
}

// Essentially the same procedure as above, but for metarelations
export function draw_metarelation(draw_context, mei_graph, g_elem) {
  var added = []
  // Draw target, prefix, ID and type
  var svg_elem = draw_context.svg_elem
  var id_prefix = draw_context.id_prefix
  var id = id_prefix + g_elem.getAttribute('xml:id')
  var type = relation_type(g_elem)
  // Get the targets - we don't differentiate primaries and secondaries in
  // this drawing style.
  var targets = relation_allnodes(mei_graph, g_elem).map(
    (e) => document.getElementById(draw_context.id_prefix + get_id(e)))
  var primaries = relation_primaries(mei_graph, g_elem).map(
    (e) => document.getElementById(id_in_svg(draw_context, node_to_note_id(e)))
  )
  var secondaries = relation_secondaries(mei_graph, g_elem).map(
    (e) => document.getElementById(id_in_svg(draw_context, node_to_note_id(e)))
  )
  // TODO should be possible to draw partial metarelations
  if (targets.indexOf(null) != -1) {
    console.log('Missing relation, not drawing metarelation')
    return []
  }

  // Where are our targets
  var coords = targets.map(get_metarelation_target)
  // What's midpoint above them?
  var x = average(coords.map((e) => e[0]))
  // Above the system, and also above the relations
  var y = targets.concat([svg_elem.getElementsByClassName('system')[0]]).map((b) => b.getBBox().y).sort((a, b) => a > b)[0] - 500

  coords.push([x, y])
  // We make a group
  var g_elem = g()
  g_elem.style.setProperty('--shade-alternate', '#000')
  g_elem.setAttribute('id', id)
  g_elem.classList.add('metarelation')
  // TODO: Use classlist for types
  g_elem.setAttribute('type', type)
  // Draw the metarelation as a circle connected with lines to each of its
  // targets
  g_elem.appendChild(circle([x, y], 200))
  coords.forEach((crds) => {
    var line_elem = line([x, y], crds)
    g_elem.appendChild(line_elem)
  })
  // Type-dependent shades
  if (getShades())
    toggle_shade(g_elem)
  // We can scroll among metarelations as well
  g_elem.onwheel = (e) => {
    var elem1 = e.target
    flip_to_bg(elem1.closest('g'))
    g_elem.onmouseout()
    return false
  }

  // Decorate with onclick and onmouseover handlers
  g_elem.onclick = () => toggle_selected(g_elem)
  g_elem.onmouseover = function (ev) {
    primaries.forEach((item) => {
      if (item.classList.contains('relation'))
	    item.classList.add('extrarelationhover')
      else
	    item.children[0].classList.add('extrarelationhover')
    })
    secondaries.forEach((item) => {
      if (item.classList.contains('relation'))
	    item.classList.add('relationhover')
      else
	    item.children[0].classList.add('relationhover')
    })
  }
  g_elem.onmouseout = function (ev) {
    primaries.forEach((item) => {
      if (item.classList.contains('relation'))
	    item.classList.remove('extrarelationhover')
      else
	    item.children[0].classList.remove('extrarelationhover')
    })
    secondaries.forEach((item) => {
      if (item.classList.contains('relation'))
	    item.classList.remove('relationhover')
      else
	    item.children[0].classList.remove('relationhover')
    })
  }

  // TODO: Set up more onhover stuff for The Same Relation
  // Elsewhere - but perhaps that's a separate thing?

  // Add it to the SVG
  add_to_svg_bg(svg_elem, g_elem)
  // Remember what we're adding
  added.push(g_elem)
  return added
}
