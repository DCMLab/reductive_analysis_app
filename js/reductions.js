function calc_reduce_arg(mei_graph, remaining_relations, target_relations,
                         remove_only_primary_relations = true, 
			 allow_partial_relations       = false){
  // No primary of a remaining relation is removed in this
  // reduction
  var remaining_nodes = remaining_relations.map(
    		      (he) => relation_primaries_arg(mei_graph,he)
    		    ).flat();
  // We know that the remaining relations that have not been
  // selected for reduction will remain
  remaining_relations = remaining_relations.filter((x) => {return !target_relations.includes(x);});
  // If we're not removing primary-only relations, we need to get them back
  // from the targets
  if(!remove_only_primary_relations){
    var more_remains = target_relations.filter((he) => 
	  relation_secondaries_arg(mei_graph,he).length == 0);
    // Add those relations to the ones that need to stay
    remaining_relations = remaining_relations.concat(more_remains);
    // And remove them from those that may be removed
    target_relations = target_relations.filter((x) => {return !more_remains.includes(x);})
    // And update the remaining nodes (if we're disallowing partial relations)
    if(!allow_partial_relations)
      remaining_nodes = remaining_nodes.concat(more_remains.map(
		      (he) => relation_secondaries_arg(mei_graph,he)
		    ).flat());
  }

  // So all of their nodes should be added to the remaining
  // nodes, not just the primaries
  // Unless we allow partial relations
  if(!allow_partial_relations)
    remaining_nodes = remaining_nodes.concat(remaining_relations.map(
		    (he) => relation_secondaries_arg(mei_graph,he)
		  ).flat());

  do {
    // We want to find more relations that we know need to stay 
    var more_remains = target_relations.filter((he) => { 
        // That is, relations that have, as secondaries, nodes
        // we know need to stay
        return (relation_secondaries_arg(mei_graph,he).findIndex((x) => {return remaining_nodes.includes(x);}) > -1);
      });
    // Add those relations to the ones that need to stay
    remaining_relations = remaining_relations.concat(more_remains);
    // And remove them from those that may be removed
    target_relations = target_relations.filter((x) => {return !more_remains.includes(x);})
    // And update the remaining nodes
    // And update the remaining nodes (if we're disallowing partial relations)
    if(!allow_partial_relations)
      remaining_nodes = remaining_nodes.concat(more_remains.map(
		      (he) => relation_secondaries_arg(mei_graph,he)
		    ).flat());
  // Until we reach a pass where we don't find any more
  // relations that need to stay
  }while(more_remains.length > 0)
  // Any relations that remain after this loop, we can remove,
  // including their secondaries

  return [target_relations, 
          [...new Set(target_relations.flatMap(
            (he) => relation_secondaries_arg(mei_graph,he)
          ))]];

}


// Do a reduction in the context, using the given graph and the
// (optional) selected hyperedges from this context.
function do_reduce_arg(draw_context, mei_graph, selection,
                       remove_only_primary_relations = true, 
                       allow_partial_relations       = false){
  var target_relations = selection.map(
        (ge) => get_by_id(mei_graph.getRootNode(), id_or_oldid(ge))
      );

  var all_relations_nodes = Array.from(mei_graph.getElementsByTagName("node")).filter((x) => { return x.getAttribute("type") == "relation";});

  var remaining_relations = all_relations_nodes.filter(
        (n) => {
           var g = get_by_id(document,draw_context.id_prefix + n.getAttribute("xml:id"));
           return g != undefined && g.style.visibility != "hidden";
         }
      );

  if(target_relations.length == 0)
    target_relations = remaining_relations;

  // The removed notes we get are _nodes in the graph_, but
  // hide_note_arg is built with that in mind.
  var [removed_relations, removed_notes] = calc_reduce_arg(mei_graph, 
                                                           remaining_relations, 
    						           target_relations,
						           remove_only_primary_relations,
                                                           allow_partial_relations);
  var graphicals =[];   
  graphicals.push(removed_relations.map(
    		(r) => hide_he_arg(draw_context,r)
    	      ));

  graphicals.push(removed_notes.map(
                      (n) => hide_note_arg(draw_context,n)
    	      ));

  return [removed_relations,removed_notes,graphicals];
}


