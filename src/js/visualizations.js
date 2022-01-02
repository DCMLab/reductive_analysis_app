import newApp from './new/app'
import { getMeiGraph } from './app'
import { adjust_top, clear_top, toggle_selected, toggle_shade } from './ui'
import {
  add_to_svg_bg,
  circle,
  flip_to_bg,
  g,
  get_by_id,
  get_id,
  id_in_svg,
  node_to_note_id,
  note_coords,
  note_to_text,
  relation_allnodes,
  relation_type,
  roundedHull,
  text,
  tspan,
} from './utils'
import { calc_reduce } from './reductions'

// Returns a list of list of IDs
function calc_hierarchy(notes, relations, roots_low = true) {
  var mei_graph = getMeiGraph()
  var ret = []
  var rels = relations
  var ns = notes.filter((x) => x != undefined)
  do {
    let ret_notes = []
    if (roots_low)
      ret_notes = ns.filter((n) => !(rels.find((r) => relation_allnodes(mei_graph, r).includes(n))))
    var [removed_relations, removed_notes] = calc_reduce(mei_graph,
							 rels,
							 rels)
    ret_notes = ret_notes.concat(removed_notes.filter((n) => ns.includes(n)))
    ret.push(ret_notes)
    ns = ns.filter((x) => !ret_notes.includes(x))
    rels = rels.filter((x) => !removed_relations.includes(x))
  } while (removed_notes.length + removed_relations.length > 0)
  ret.push(ns)
  return ret
}

export function draw_hierarchy_graph(draw_context, hullPadding = 200, roots_low = true) {
  var svg_elem = draw_context.svg_elem
  var id_prefix = draw_context.id_prefix
  var existing = clear_top(draw_context)
  var g_elem = g()
  g_elem.id = 'hier' + id_prefix

  // find layers
  var current_note_nodes = Array.from(svg_elem.
    getElementsByClassName('note')).
    map(get_id).
    map((id) => get_by_id(mei, id)).
    map(get_id).
    map((id) => get_by_id(mei, 'gn-' + id)).
    filter((x) => x != undefined)
  var current_relation_nodes = Array.from(svg_elem.
    getElementsByClassName('relation')).
					    map(get_id).
					    map((id) => get_by_id(mei, id))
  var layers = calc_hierarchy(current_note_nodes, current_relation_nodes, roots_low)

  // find top of system
  var svg_top = 0
  var layer_dist = 500

  // find coordinates
  var layers_coords = layers.flatMap((layer, ix) => layer.map((e) => {
    let n = document.getElementById(id_in_svg(draw_context, node_to_note_id(e)))
    let [x, y] = note_coords(n)
    return [e, [x, svg_top - layer_dist * ix]]
  }))

  // TODO: For now draw only one node per place - needs changing when
  // interactive
  var placed_nodes = {}
  // draw nodes
  layers_coords.forEach(([e, p]) => {
    let r = hullPadding < 100 ? 50 : hullPadding / 2
    let fontSize = (r < 100 ? 200 : (r > 200 ? 400 : r * 2))
    let note_id = node_to_note_id(e)
    let note_g = placed_nodes[p]
    let txt
    let txt_p = [p[0] + r + 10, p[1] + r + 25 - fontSize]
    if (!note_g) {
      note_g = g()

      let circ = circle(p, r)
      note_g.appendChild(circ)
      note_g.id = 'hier' + id_prefix + note_id

      txt = text('', txt_p)
      txt.style.fontFamiy = 'sans-serif'
      txt.style.fontSize = fontSize + 'px'
      txt.classList.add('nodetext')

      note_g.appendChild(txt)
      g_elem.appendChild(note_g)
      placed_nodes[p] = note_g
    } else
      txt = note_g.getElementsByTagName('text')[0]
    let tsp = tspan(note_to_text(note_id), txt_p, fontSize)
    txt.appendChild(tsp)
  })

  // draw hierarchy
  current_relation_nodes.forEach((r) => {
    // ID, type, and original SVG elem
    let id = id_prefix + r.getAttribute('xml:id')
    let type = relation_type(r)
    let elem_in_score = document.getElementById(id)

    let nodes = relation_allnodes(getMeiGraph(), r)
    let node_coords = nodes.map((n) => layers_coords.find((x) => x[0] == n)[1])

    let elem = roundedHull(node_coords, hullPadding)
    elem.setAttribute('id', 'hier' + id)
    if (id_prefix != '')
      elem.setAttribute('oldid', g_elem.getAttribute('xml:id'))
    elem.classList.add('relation')

    elem.setAttribute('type', type)

    // Are we running with type-specific shades?
    if (newApp.ui.scoreSettings.brightShades) {
      toggle_shade(elem)
    }

    elem.onclick = ev => toggle_selected(elem_in_score)

    elem.onmouseover = function () {
      elem_in_score.classList.add('relationhover')
      elem_in_score.onmouseover()
    }
    elem.onmouseout = function () {
      elem_in_score.classList.remove('relationhover')
      elem_in_score.onmouseout()
    }

    // Relations can be scrolled
    elem.addEventListener('wheel', e => {
      e.preventDefault()
      flip_to_bg(e.target)
      e.target.onmouseout()
    }, captureEvent)

    // Add it to the SVG
    g_elem.appendChild(elem)

  })
  add_to_svg_bg(svg_elem, g_elem)

  // change viewport
  adjust_top(draw_context, (layers.length * layer_dist))

}
