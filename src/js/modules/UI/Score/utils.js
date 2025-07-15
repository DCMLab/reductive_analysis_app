import { getMeiGraph } from '../../../bootstrap'

export function hide_orphan_notes() {
  var mei_graph = getMeiGraph()
  var ids =
    Array
      .from(document.getElementsByClassName('note'))
      .map(e => e.id)
  var gn_ids =
    Array
      .from(mei_graph.getElementsByTagName('arc'))
      .map(e => e.getAttribute('to'))

  ids.forEach(i => {
    var ii = i.replace(/([a-z]\d-)+/, '') // Replace layer or view prefixes.
    if (!gn_ids.includes(`#gn-${ii}`)) {
      document.getElementById(i).classList.add('hidden')
    }
  })
}

export function show_all_notes() {
  Array.from(document.querySelectorAll('g.note')).forEach(e => e.classList.remove('hidden'))
}
