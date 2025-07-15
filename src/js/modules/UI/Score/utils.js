import { getMeiGraph } from '../../../bootstrap'
import { hide_classes } from '../../../conf'

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

export function set_non_note_visibility(hidden) {
  console.debug('Using globals: document for element selection')

  Array.from(document.getElementsByClassName('beam')).forEach(x =>
    Array.from(x.children)
      .filter(x => x.tagName == 'polygon')
      .forEach(x => x.classList.toggle('hidden', hidden))
  )

  hide_classes.forEach(cl =>
    Array.from(document.getElementsByClassName(cl)).forEach(x =>
      x.classList.toggle('hidden', hidden)
    )
  )
}
