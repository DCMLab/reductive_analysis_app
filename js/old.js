//main.js

function do_reduce_old(sel, extra) {
  console.debug("Using globals: undo_actions, mei, mei_graph, selected,  extraselected.");
  // All previous reductions
  var reduce_actions = undo_actions.filter((x) => x[0] == "reduce").map((x) => x[1]); 
  // All relations in the graph
  var all_relations_nodes = Array.from(mei_graph.getElementsByTagName("node")).filter((x) => { return x.getAttribute("type") == "relation";}) 
  // Remove the relations that have been removed in previous
  // reductions
  var remaining_relations = all_relations_nodes.filter((x) => { 
    return !reduce_actions.flat().flat().includes(x);
  });
  var reduce_action, relations_nodes;
  // Are we doing a full reduction, or have we selected some
  // relations?
  if(sel.length > 0 && sel[0].classList.contains("relation")){
    relations_nodes = sel.concat(extra).map((elem) => get_by_id(mei,elem.id));
  }else {
    relations_nodes = remaining_relations;
  }
  // No primary of a remaining relation is removed in this
  // reduction
  var remaining_nodes = remaining_relations.map(relation_primaries).flat();
  // We know that the remaining relations that have not been
  // selected for reduction will remain
  remaining_relations = remaining_relations.filter((x) => {return !relations_nodes.includes(x);});
  // So all of their nodes should be added to the remaining
  // nodes, not just the primaries
  remaining_nodes = remaining_nodes.concat(remaining_relations.map(relation_secondaries).flat());

  do {
    // We want to find more relations that we know need to stay 
    var more_remains = relations_nodes.filter((he) => { 
        // That is, relations that have, as secondaries, nodes
        // we know need to stay
        return (relation_secondaries(he).findIndex((x) => {return remaining_nodes.includes(x);}) > -1);
      });
    // Add those relations to the ones that need to stay
    remaining_relations = remaining_relations.concat(more_remains);
    // And remove them from those that may be removed
    relations_nodes = relations_nodes.filter((x) => {return !more_remains.includes(x);})
    // And update the remaining nodes
    remaining_nodes = remaining_nodes.concat(more_remains.map(relation_secondaries).flat());
  // Until we reach a pass where we don't find any more
  // relations that need to stay
  }while(more_remains.length > 0)
  // Any relations that remain after this loop, we can remove,
  // including their secondaries

  reduce_action = relations_nodes;

  if(reduce_action.length == 0){
    console.log("No reduction possible");
    return;
  }
  undo_actions.push(["reduce", reduce_action.map((he) => {
    var secondaries = relation_secondaries(he);
    var graphicals = [];
    graphicals.push(secondaries.map(hide_note));
    graphicals.push(hide_he(he));
    return [he,secondaries,graphicals];
  }),sel, extra]);
}

// OK we've selected stuff, let's make the selection into a
// series of edges
function do_edges() {
    console.debug("Using globals: selected, extraselected, mei, orig_mei, undo_actions");
    if (selected.length == 0 && extraselected == 0) {
      return;}
    changes = true;
    var added = [];
    added.push(draw_edges()); // Draw the edge
    added.push(add_edges(mei));  // Add it to the MEI
    if(mei != orig_mei)
      added.push(add_edges(orig_mei));
    
    undo_actions.push(["edges",added,selected,extraselected]);
    selected.forEach(toggle_selected); // De-select
    extraselected.forEach(toggle_selected); // De-select
}

function do_relation_old(type,arg){
    if(selected.concat(extraselected)[0].classList.contains("relation")){
      var types = [];
      selected.concat(extraselected).forEach((he) => {
      //TODO: move type_synonym application so that this
      //is the right type == the one from the MEI
      types.push([he.getAttribute("type"),type]);
      he.setAttribute("type",type);
      var mei_he = get_by_id(mei,id_or_oldid(he));
      mei_he.getElementsByTagName("label")[0].setAttribute("type",type);
      toggle_shade(he);
      });
      update_text();
      undo_actions.push(["change relation type",types.reverse(),selected,extraselected]);
    }else if(selected.concat(extraselected)[0].classList.contains("note")){
      var added = [];
      [he_id,mei_elems] = add_relation(mei,mei_graph,type);
      added.push(mei_elems);  // Add it to the MEI
      if(mei != orig_mei){
	var [orig_he_id,orig_mei_elems] = add_relation(orig_mei,orig_mei_graph,type,he_id);
	added.push(orig_mei_elems);  // Add it to the MEI
      }
      added.push(draw_relation(he_id,type)); // Draw the edge
      undo_actions.push(["relation",added,selected,extraselected]);
      mark_secondaries(get_by_id(mei,he_id));
      selected.concat(extraselected).forEach(toggle_selected); // De-select
    }
}



function draw_graph_old(draw_context) {
  console.debug("Using globals: mei_graph, mei, selected, extraselected, document");
  var mei = draw_context.mei;
  var mei_graph = mei.getElementsByTagName("graph")[0];
  // There's a multi-stage process to get all the info we
  // need... First we get the nodes from the graph element.
  var nodes_array = Array.from(mei_graph.getElementsByTagName("node"));
  // Get the nodes representing relations
  var relations_nodes = nodes_array.filter((x) => { return x.getAttribute("type") == "relation";})
  // Get the nodes representing metarelations
  var metarelations_nodes = nodes_array.filter((x) => { return x.getAttribute("type") == "metarelation";})

  // Next we get the note labels
  var note_ids = nodes_array.map((x) => {
                try{
                  return [x, 
                          note_get_sameas(x)]
                }catch{
                  return [];
                }
              }).filter((x) => {return x.length != 0;});
  // Now get the arcs/edges
  var arcs_array = Array.from(mei_graph.getElementsByTagName("arc"));
  var relations_arcs = [];
  var metarelations_arcs = [];
  // And draw them all.
  arcs_array.forEach((x) => {
      var n1 = get_by_id(mei,x.getAttribute("from")); 
      var n2 = get_by_id(mei,x.getAttribute("to"));
      if (!relations_nodes.includes(n1) && !metarelations_nodes.includes(n1)){
        //Regular edge, just draw. TODO: Fix assumption that
        //nodes are notes if we reach this.
        var id1 = note_ids.find((y) => {
              return y[0] == n1;
            })[1];
        var id2 = note_ids.find((y) => {
              return y[0] == n2;
            })[1];
        selected = [get_by_id(document,id1),get_by_id(document,id2) ];
        draw_edges();
        selected = [];
      }else if (!metarelations_nodes.includes(n1)){
        var id2 = note_ids.find((y) => {
              return y[0] == n2;
            })[1];
        relations_arcs.push([n1,id2,x.getAttribute("type")]);
      }else {
        metarelations_arcs.push([n1,n2.getAttribute("xml:id"),x.getAttribute("type")]);
      }

  });
  relations_nodes.forEach((x) => {
      var relation_nodes = relations_arcs.
                  filter((y) => {return y[0] == x;}).
                  map((y) => {return [y[2],get_by_id(document,y[1])];})
      selected = relation_nodes.
                  filter((y) => {return y[0] == "secondary";}).
                  map((y) => { return y[1];});
      extraselected = relation_nodes.
                  filter((y) => {return y[0] == "primary";}).
                  map((y) => { return y[1];});
      var he_labels = x.getElementsByTagName("label");
      var type = "";
      if(he_labels.length > 0){
        type = he_labels[0].getAttribute("type");
      }
      var added = draw_relation(x.getAttribute("xml:id"),type);
      if(added.length != 0)
        mark_secondaries(x);
      selected = [];
      extraselected = [];
    });

  metarelations_nodes.forEach((x) => {
      var metarelation_nodes = metarelations_arcs.
                  filter((y) => {return y[0] == x;}).
                  map((y) => {return [y[2],get_by_id(document,y[1])];})
      selected = metarelation_nodes.
                  filter((y) => {return y[0] == "secondary";}).
                  map((y) => { return y[1];});
      extraselected = metarelation_nodes.
                  filter((y) => {return y[0] == "primary";}).
                  map((y) => { return y[1];});
      var me_labels = x.getElementsByTagName("label");
      var type = "";
      if(me_labels.length > 0){
        type = me_labels[0].getAttribute("type");
      }
      var added = draw_metarelation(x.getAttribute("xml:id"),type);
      selected = [];
      extraselected = [];
    });


}

//utils.js

function add_to_svg_bg(newElement) {
  var sibling = document.getElementsByClassName("system")[0];
  var parent = sibling.parentNode;
  console.debug("Using global: document to get 'system' element");
  parent.insertBefore(newElement,sibling);
}

function add_to_svg_fg(newElement) {
  var sibling = document.getElementsByClassName("system")[0];
  console.debug("Using global: document to get 'system' element");
  var parent = sibling.parentNode;
  parent.appendChild(newElement);
}


function g() {
  var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'g');
  console.debug("Using global: document to create new element");
  return newElement;
}

// Get the MEI-graph nodes that are adjacent to a relation
function relation_allnodes(he) {
  console.debug("Using globals: mei, mei_graph to find graph connections");
  var arcs_array = Array.from(mei_graph.getElementsByTagName("arc"));
  var nodes = [];
  arcs_array.forEach((a) => {
        if(a.getAttribute("from") == "#"+he.getAttribute("xml:id")){
          nodes.push(get_by_id(mei,a.getAttribute("to")));
        }
      });
  return nodes;
}
// Get the MEI-graph nodes that are adjacent and primary to a relation
function relation_primaries(he) {
  console.debug("Using globals: mei, mei_graph to find graph connections");
  var arcs_array = Array.from(mei_graph.getElementsByTagName("arc"));
  var nodes = [];
  arcs_array.forEach((a) => {
    if(a.getAttribute("from") == "#"+he.getAttribute("xml:id") &&
       a.getAttribute("type") == "primary"){
      nodes.push(get_by_id(mei,a.getAttribute("to")));
    }
      });
  return nodes;
}
// Get the MEI-graph nodes that are adjacent and secondary to a relation
function relation_secondaries(he) {
  console.debug("Using globals: mei, mei_graph to find graph connections");
  var arcs_array = Array.from(mei_graph.getElementsByTagName("arc"));
  var nodes = [];
  arcs_array.forEach((a) => {
    if(a.getAttribute("from") == "#"+he.getAttribute("xml:id") &&
       a.getAttribute("type") == "secondary"){
      nodes.push(get_by_id(mei,a.getAttribute("to")));
    }
      });
  return nodes;
}
// Set up new graph node for a note
function add_mei_node_for(mei,mei_graph,note) {
    console.debug("Using globals: mei, mei_graph to create and place elem");
    var id = note.getAttribute("id");
    var elem = get_by_id(mei,"gn-"+id);
    if (elem != null) {
      return elem;
    }
    elem = mei.createElement("node");
    // This node represent that note
    var label = mei.createElement("label");
    var note = mei.createElement("note");
    note.setAttribute("sameas","#"+id);
    elem.appendChild(label);
    label.appendChild(note);
    // But should have a separate XML ID
    elem.setAttribute("xml:id","gn-" + id);
    mei_graph.appendChild(elem);
    return elem;
}
            
// Find graphical element and hide it
function hide_note(note) {
  console.debug("Using globals: document to find elem");
  var elem = get_by_id(document,note_get_sameas(note));
  if(elem)
    elem.classList.add("hidden");
  return elem;
}

// Find graphical element and hide it
function hide_he(he) {
  console.debug("Using globals: document to find elem");
  var elem = get_by_id(document,he.getAttribute("xml:id"));
  if(elem) 
    elem.classList.add("hidden");
  return elem;
}

// For a certain relation, find its secondaries and mark them
function mark_secondaries(he) {
    console.debug("Using globals: document, mei to find elems");
    if(!mei.contains(he))
      he = get_by_id(mei,he.id);
    var secondaries = relation_secondaries(he);
    secondaries.forEach((n) => {
	var svg_note = get_by_id(document,note_get_sameas(n));
	mark_secondary(svg_note);
    });
}


// For a certain relation, find its secondaries and unmark them
function unmark_secondaries(he) {
    console.debug("Using globals: document, mei to find elems");
    if(!mei.contains(he))
      he = get_by_id(mei,he.id);
    var secondaries = relation_secondaries(he);
    secondaries.forEach((n) => {
	var svg_note = get_by_id(document,note_get_sameas(n));
	unmark_secondary(svg_note);
    });
}

// draw.js

// Draw a series of edges (TODO: make it much much much better)
function draw_edges() {
  console.debug("Using globals: selected");
  var added = [];
  if(selected.includes(undefined))
    return [];
  for(var i = 1; i < selected.length; i++) {
    note1 = note_coords(selected[i-1]);
    note2 = note_coords(selected[i]);
    //added.push(line(note1,note2));
    var elem = roundedHull([note1,note2]);
    add_to_svg_bg(elem);
    added.push(elem);
  // TODO: Add selectability on edge.
  }
  return added;
}

// Draw a relation as a  series of edges (TODO: make it much much much better)
// New version below as draw_relation_arg. It will draw based on
// an already MEI-encoded relation rather than this ad-hoc
// stuff.
function draw_relation(id,type) {
  console.debug("Using globals: selected, extraselected, mei, mei_graph, shades");
  var added = [];
  var notes = selected.concat(extraselected);
  if(notes.includes(undefined)) {
    console.log("Note missing, relation not drawn");
    return [];
  }
  var secondaries = selected;
  var primaries = extraselected;

  notes.sort((a,b) => { 
      var p1= note_coords(a);
      var p2= note_coords(b);
      return (p1[0] - p2[0]) ? (p1[0] - p2[0]) : (p1[1] - p2[1]);
    });


  var elem = roundedHull(notes.map(note_coords));
  elem.setAttribute("id",id);
  elem.classList.add("relation");
  elem.setAttribute("type",type);
  elem.onwheel = (e) => {
    var elem1 = e.target;
    var paren = elem1.parentElement;
    paren.removeChild(elem1);
    paren.insertBefore(elem1,paren.children[0]);
    elem.onmouseout();
    return false;
  };
  if(shades)
    toggle_shade(elem);
  add_to_svg_bg(elem);
  added.push(elem);
  elem.onclick = function(ev) {toggle_selected(elem,ev.shiftKey);};
  elem.onmouseover = function (ev) {
    primaries.forEach((item) => { item.classList.add("extrahover");});
    secondaries.forEach((item) => { item.classList.add("selecthover");});
  }
  elem.onmouseout = function (ev) {
    primaries.forEach((item) => { item.classList.remove("extrahover");});
    secondaries.forEach((item) => { item.classList.remove("selecthover");});
  }

  return added;
}

function draw_metarelation(id,type) {
  console.debug("Using globals: selected, extraselected, document, shades");
  var added = [];
  var targets =selected.concat(extraselected); 
  var coords = targets.map(get_metarelation_target);
  var x = average(coords.map((e) => e[0]));
  // Above
  var y =
    targets.concat([document.getElementsByClassName("system")[0]]).map((b) => b.getBBox().y).sort((a,b) => a > b)[0] - 500;

  coords.push([x,y]);
  var g_elem = g();
  var elem = roundedHull(coords);
  g_elem.setAttribute("id",id);
  g_elem.classList.add("metarelation");
  g_elem.setAttribute("type",type);
  g_elem.onwheel = (e) => {
    var elem1 = e.target;
    var paren = elem1.parentElement;
    paren.removeChild(elem1);
    paren.insertBefore(elem1,paren.children[0]);
    return false;
  };
  coords.forEach((crds) => { var line_elem = line([x,y],crds);
      g_elem.appendChild(line_elem);});
  g_elem.appendChild(circle([x,y],200));
  if(shades)
    toggle_shade(g_elem);
  add_to_svg_bg(g_elem);
  added.push(g_elem);
  g_elem.onclick = function(ev) {toggle_selected(g_elem,ev.shiftKey);};
  g_elem.onmouseover = function (ev) {
    targets.forEach((item) => { item.classList.add("relationhover"); });
  }
  g_elem.onmouseout = function (ev) {
    targets.forEach((item) => { item.classList.remove("relationhover"); });
  }
  return added;
  

}

