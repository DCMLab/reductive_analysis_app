import { get_by_id, get_id, note_coords } from './utils'

// TODO:
// Render to MIDI :check:
// Get all notes :check:
// Make a timestamp-to-ID map :check:
//   var time_id_map = {};
//   ids.map((id) => {if(!id) return; let t = vrvToolkit.getTimeForElement(id); if(!time_id_map[t]) time_id_map[t] = [id]; else time_id_map[t].push(id); })
// Create a new score element with everything (mdiv etc.)
// Choose number of systems?
// Make a measure for each slice
// Add the notes of that slice
//  by onset (schenkerian)
//  or by presence, tied (protovoice)
// Take care when adding to only add one "note" per pitch (use @sameas)
// Optionally do verticalisations
function slicify(draw_context, score_elem, tied = false) {
  var mei = getMei()
  var mei2 = rerender_mei(true, draw_context)
  var data2 = new XMLSerializer().serializeToString(mei2)
  vrvToolkit.loadData(data2)
  vrvToolkit.renderToMIDI()
  var notes = Array.from(mei2.getElementsByTagName('note'))
  var ids = notes.map((n) => n.getAttribute('xml:id'))
  var time_id_map = {}
  ids.forEach((id) => {
    if (!id) return
    let t = vrvToolkit.getTimeForElement(id)
    if (!time_id_map[t])
      time_id_map[t] = [id]
    else
      time_id_map[t].push(id)
  })

  if (tied) {
    let ts = Object.keys(time_id_map)
    time_id_map = {}
    ts.forEach((t) => time_id_map[t] = vrvToolkit.getElementsAtTime(Number(t) + 1).notes)
  }

  // Get a new score element, update scoreDef etc.

  var modified_scoreDef = score_elem.getElementsByTagName('scoreDef')[0].cloneNode(true)
  var staffDefs = modified_scoreDef.getElementsByTagName('staffDef')
  var new_score_elem = mei.createElement('score')
  new_score_elem.setAttribute('xml:id', score_elem.getAttribute('xml:id') + '-sliced')
  var new_section_elem = mei.createElement('section')
  new_section_elem.setAttribute('xml:id', score_elem.getAttribute('xml:id') + '-slicedsection')
  new_score_elem.appendChild(modified_scoreDef)
  new_score_elem.appendChild(new_section_elem)
  var ts = Object.keys(time_id_map)
  for (ix in ts) {
    let t = ts[ix]
    let ids = time_id_map[t]
    let new_measure = mei.createElement('measure')
    new_measure.setAttribute('xml:id', 'measure-' + t)
    new_section_elem.appendChild(new_measure)
    for (staffDef of staffDefs) {
      let new_staff = mei.createElement('staff')
      // TODO: set ID
      new_staff.setAttribute('n', staffDef.getAttribute('n'))
      new_measure.appendChild(new_staff)
    }

    // Just add in the onset slice for now
    // For the rest, we need to use vrvToolkit.getElementsAtTime and then
    // Be Smart(tm) about adding ties and updating IDs
    ids.forEach((id) => {
      let old_note = get_by_id(mei, id)
      let new_note = old_note.cloneNode(true)
      new_note.setAttribute('corresp', id)
      let staff_n = old_note.closest('staff').getAttribute('n')
      let layer_n = old_note.closest('layer').getAttribute('n')
      let old_chord = old_note.closest('chord')
      let staff = new_measure.querySelector('staff[n="' + staff_n + '"]')
      if (!staff) {
	  console.log('Could not find staff')
	  abort()
      }
      let layer = staff.querySelector('layer[n="' + layer_n + '"]')
      if (!layer) {
        layer = mei.createElement('layer')
        layer.setAttribute('n', layer_n)
        // TODO: set ID
        staff.appendChild(layer)
      }
      new_note.removeAttribute('dots')
      new_note.removeAttribute('dots.ges')
      if (old_chord) {
        let chord_id = old_chord.getAttribute('xml:id')
        let new_chord = layer.querySelector('chord[corresp="' + chord_id + '"]')
        if (!new_chord) {
	  new_chord = mei.createElement('chord')
	  new_chord.setAttribute('corresp', chord_id)
	  new_chord.setAttribute('dur', 4)
	  new_chord.setAttribute('dur.ges', 4)
	  new_chord.setAttribute('dur.ppq', 2)
	  layer.appendChild(new_chord)
        }
        new_chord.appendChild(new_note)
      } else {
        new_note.setAttribute('dur', 4)
        new_note.setAttribute('dur.ges', 4)
        new_note.setAttribute('dur.ppq', 2)
        layer.appendChild(new_note)
      }
      // Is this a tied note?
      if (ix > 0 && (time_id_map[ts[ix - 1]]).includes(id)) {
        // Change the ID
        new_note.setAttribute('xml:id', t + id)
        let tie = mei.createElement('tie')
        tie.setAttribute('xml:id', 'tie' + t + id)
        tie.setAttribute('endid', t + id)
        // Was the previous note also tied?
        if (ix > 1 && time_id_map[ts[ix - 2]].includes(id))
	  tie.setAttribute('startid', ts[ix - 1] + id)
        else
	  tie.setAttribute('startid', id)
        new_measure.appendChild(tie)
      }

    })
    for (staff of new_measure.querySelectorAll('staff')) {
      if (!staff.querySelector('note')) {
        let layer = staff.querySelector('layer')
        if (!layer) {
	  layer = mei.createElement('layer')
	  // TODO: set ID
	  staff.appendChild(layer)
        }
        let rest = mei.createElement('rest')
        rest.setAttribute('dur', 4)
        rest.setAttribute('dur.ges', 4)
        rest.setAttribute('dur.ppq', 2)
        layer.appendChild(rest)
      }
    }

  };
  return new_score_elem
}

function new_sliced_layer(draw_context, tied = false) {
  var score_elem = draw_context.mei_score
  var new_score_elem = slicify(draw_context, score_elem, tied)
  var n_layers = score_elem.parentElement.getElementsByTagName('score').length
  var prefix = n_layers + '-' // TODO: better prefix computation
  // The - is there to not clash with view
			     // prefixes
  prefix_ids(new_score_elem, prefix) // Compute a better prefix
  // Insert after the previous
  score_elem.parentNode.insertBefore(new_score_elem, score_elem.nextSibling)
  return new_score_elem
}
