
function update_metadata() {
  //Runs after focus leaves one of the metadata text fields
}

function give_responsibility_selected(resp) {
  // Loops through the selected (SVG) relations and notes and assigns @resp
  // to the argument xml:id
  // Make this undoable
}

function remove_responsibility() {
  // Loops through the selected (SVG) relations and notes, removing
  // responsibility annotations
  // Make this undoable
}


function add_responsible() {
  // Add textfields and buttons for another responsible person
  // Make this undoable
}

function delete_responsible() {
  // Remove a responsible person
  // Traverse all the nodes looking for attributes where this is the
  // responsible person and remove them
  // Make this an undoable action
}





