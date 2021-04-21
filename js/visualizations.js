




// Returns a list of list of IDs
function calc_hierarchy(notes, relations) {
  var ret = [];
  var rels = relations;
  do{
    var [removed_relations, removed_notes] = calc_reduce(mei_graph, 
							 rels, 
							 rels);
    ret.push(removed_notes);
    console.log(removed_notes, removed_relations);
    notes = notes.filter((x) => !ll_removed_notes.includes(x))
    rels = rels.filter((x) => !removed_relations.includes(x))
  }while(removed_notes.length + removed_relations.length  > 0)
  return ret;
}


