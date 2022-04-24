import { getDrawContexts } from './app'
import { get_by_id, get_id } from './utils'

export function naturalize_note(elem) {
  let svg_accid = elem.querySelector('.accid')
  if (!svg_accid) {
    console.log('No accidental to remove')
    return
  }
  remove_accidental(svg_accid)
  svg_accid.classList.add('hidden')
  let accid_id = get_id(svg_accid)
  var draw_contexts = getDrawContexts()
  for (const dc of draw_contexts) {
    let dc_id = dc.id_prefix + accid_id
    let svg_dc_elem = document.getElementById(dc_id)
    if (svg_dc_elem)
      svg_dc_elem.classList.add('hidden')
  }
}

function remove_accidental(elem) {
  var note_elem = elem.parentElement
  while (!note_elem.classList.contains('note'))
    note_elem = note_elem.parentElement

  var mei_note_id = get_id(note_elem)
  var mei_note = get_by_id(mei, mei_note_id)

  remove_mei_accidental(mei_note)
}

function remove_mei_accidental(mei_note) {
  // TODO: Many different ways to encode accidentals
  // accid attribute
  mei_note.removeAttribute('accid')

  // accid child element
  var accid_elem = Array.from(mei_note.children).filter((e) => e.tagName == 'accid')
  accid_elem.forEach((e) => mei_note.removeChild(e))

  // TODO: more?
}
