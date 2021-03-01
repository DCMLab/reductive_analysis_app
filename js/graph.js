// Add a collection of edges to the MEI graph element
function add_edges(mei) {
  console.debug("Using globals: selected, mei, mei_graph");
  var added = [];
  for(var i = 0; i < selected.length; i++) {
    var elem = add_mei_node_for(mei,mei_graph,selected[i]);
    added.push(elem);
  }
  for(var i = 1; i < selected.length; i++) {
    // So that we can refer to the node (not the note) ID in
    // arcs/edges
    var elem = mei.createElement("arc");
    elem.setAttribute("from","#gn-"+selected[i-1].getAttribute("id"));
    elem.setAttribute("to","#gn-"+selected[i].getAttribute("id"));
    mei_graph.appendChild(elem);
    added.push(elem);
  }
  return added;
}

// Add a "relation" to the MEI graph element. We model this
// with a new node.
function add_relation(mei,mei_graph,type,he_id_param) {
  console.debug("Using globals: selected, extraselected");
  var added = [];
  // Add new nodes for all notes
  for(var i = 0; i < selected.length; i++) {
    var elem = add_mei_node_for(mei,mei_graph,selected[i]);
    added.push(elem);
  }
  for(var i = 0; i < extraselected.length; i++) {
    var elem = add_mei_node_for(mei,mei_graph,extraselected[i]);
    added.push(elem);
  }
  // Add a new node for the relation
  var he_elem = mei.createElement("node");
  he_elem.setAttribute("type","relation");
  var he_label = mei.createElement("label");
  if(typeof type != 'undefined')
    he_label.setAttribute("type",type)
  he_elem.appendChild(he_label);
  // Who knows if this is enough
  var he_id;
  if(typeof he_id_param == 'undefined')
    he_id = "he-"+Math.floor(Math.random() * (1 << 20)).toString(16);
  else
    he_id = he_id_param;
  he_elem.setAttribute("xml:id",he_id);
  mei_graph.appendChild(he_elem);
  added.push(he_elem);
  for(var i = 0; i < selected.length; i++) {
    // So that we can refer to the node (not the note) ID in
    // arcs/edges
    var elem = mei.createElement("arc");
    elem.setAttribute("from","#"+he_id);
    elem.setAttribute("to","#gn-"+selected[i].id);
    elem.setAttribute("type","secondary");
    mei_graph.appendChild(elem);
    added.push(elem);
  }
  for(var i = 0; i < extraselected.length; i++) {
    // So that we can refer to the node (not the note) ID in
    // arcs/edges
    var elem = mei.createElement("arc");
    elem.setAttribute("from","#"+he_id);
    elem.setAttribute("to","#gn-"+extraselected[i].id);
    elem.setAttribute("type","primary");
    mei_graph.appendChild(elem);
    added.push(elem);
  }
  return [he_id,added.reverse()];
}

function add_metarelation(mei,mei_graph,type,he_id_param) {
  console.debug("Using globals: mei, mei_graph, selected, extraselected");
  // Add a new node for the relation
  var added = [];
  var he_elem = mei.createElement("node");
  he_elem.setAttribute("type","metarelation");
  var he_label = mei.createElement("label");
  if(typeof type != 'undefined')
    he_label.setAttribute("type",type)
  he_elem.appendChild(he_label);
  // Who knows if this is enough
  var he_id;
  if(typeof he_id_param == 'undefined')
    he_id = "he-"+Math.floor(Math.random() * (1 << 20)).toString(16);
  else
    he_id = he_id_param;
  he_elem.setAttribute("xml:id",he_id);
  mei_graph.appendChild(he_elem);
  added.push(he_elem);
  for(var i = 0; i < selected.length; i++) {
    // So that we can refer to the node (not the note) ID in
    // arcs/edges
    var elem = mei.createElement("arc");
    elem.setAttribute("from","#"+he_id);
    elem.setAttribute("to","#"+selected[i].id);
    elem.setAttribute("type","secondary");
    mei_graph.appendChild(elem);
    added.push(elem);
  }
  for(var i = 0; i < extraselected.length; i++) {
    // So that we can refer to the node (not the note) ID in
    // arcs/edges
    var elem = mei.createElement("arc");
    elem.setAttribute("from","#"+he_id);
    elem.setAttribute("to","#"+extraselected[i].id);
    elem.setAttribute("type","primary");
    mei_graph.appendChild(elem);
    added.push(elem);
  }
  return [he_id,added.reverse()];
}


// Add a "relation" to the MEI graph element. We model this
// with a new node.
function add_relation_arg(mei_graph, primaries, secondaries, type, he_id_param) {
  var added = [];
  // Add a new node for the relation
  var he_elem = mei_graph.getRootNode().createElement("node");
  he_elem.setAttribute("type","relation");
  var he_label = mei_graph.getRootNode().createElement("label");
  if(typeof type != 'undefined')
    he_label.setAttribute("type",type)
  he_elem.appendChild(he_label);
  // Who knows if this is enough
  var he_id;
  if(typeof he_id_param == 'undefined')
    he_id = "he-"+Math.floor(Math.random() * (1 << 20)).toString(16);
  else
    he_id = he_id_param;
  he_elem.setAttribute("xml:id",he_id);
  mei_graph.appendChild(he_elem);
  added.push(he_elem);
  for(var i = 0; i < primaries.length; i++) {
    // So that we can refer to the node (not the note) ID in
    // arcs/edges
    var elem = mei.createElement("arc");
    elem.setAttribute("from","#"+he_id);
    elem.setAttribute("to","#"+primaries[i].getAttribute("xml:id"));
    elem.setAttribute("type","primary");
    mei_graph.appendChild(elem);
    added.push(elem);
  }
  for(var i = 0; i < secondaries.length; i++) {
    // So that we can refer to the node (not the note) ID in
    // arcs/edges
    var elem = mei.createElement("arc");
    elem.setAttribute("from","#"+he_id);
    elem.setAttribute("to","#"+secondaries[i].getAttribute("xml:id"));
    elem.setAttribute("type","secondary");
    mei_graph.appendChild(elem);
    added.push(elem);
  }
  return [he_id,added.reverse()];
}

function add_metarelation_arg(mei_graph, primaries, secondaries, type,he_id_param) {
  // Add a new node for the relation
  //TODO: we use the id attribute of the selected
  //primaries/secondaries. This is correct now, but needs
  //refactoring when the interactions start being more
  //complicated
  var added = [];
  var he_elem = mei_graph.getRootNode().createElement("node");
  he_elem.setAttribute("type","metarelation");
  var he_label = mei_graph.getRootNode().createElement("label");
  if(typeof type != 'undefined')
    he_label.setAttribute("type",type)
  he_elem.appendChild(he_label);
  // Who knows if this is enough
  var he_id;
  if(typeof he_id_param == 'undefined')
    he_id = "he-"+Math.floor(Math.random() * (1 << 20)).toString(16);
  else
    he_id = he_id_param;
  he_elem.setAttribute("xml:id",he_id);
  mei_graph.appendChild(he_elem);
  added.push(he_elem);
  for(var i = 0; i < primaries.length; i++) {
    // So that we can refer to the node (not the note) ID in
    // arcs/edges
    var elem = mei_graph.getRootNode().createElement("arc");
    elem.setAttribute("from","#"+he_id);
    elem.setAttribute("to","#"+primaries[i].getAttribute("xml:id"));
    elem.setAttribute("type","primary");
    mei_graph.appendChild(elem);
    added.push(elem);
  }
  for(var i = 0; i < secondaries.length; i++) {
    // So that we can refer to the node (not the note) ID in
    // arcs/edges
    var elem = mei_graph.getRootNode().createElement("arc");
    elem.setAttribute("from","#"+he_id);
    elem.setAttribute("to","#"+secondaries[i].getAttribute("xml:id"));
    elem.setAttribute("type","secondary");
    mei_graph.appendChild(elem);
    added.push(elem);
  }
  return [he_id,added.reverse()];
}

