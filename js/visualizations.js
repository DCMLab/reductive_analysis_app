




// Returns a list of list of IDs
function calc_hierarchy(notes, relations) {
  var ret = [];
  var rels = relations;
  var ns = notes.filter((x) => x != undefined);
  do{
    var [removed_relations, removed_notes] = calc_reduce(mei_graph, 
							 rels, 
							 rels);
    var ret_notes = removed_notes.filter((n) => ns.includes(n));
    ret.push(ret_notes);
    ns = ns.filter((x) => !removed_notes.includes(x))
    rels = rels.filter((x) => !removed_relations.includes(x))
  }while(removed_notes.length + removed_relations.length  > 0)
  ret.push(ns);
  return ret;
}


