
// Oops, undo whatever we did last.
function do_undo() {
  console.debug("Using globals: undo_actions, selected, extraselected, mei, rerendered_after_action");
  // Get latest undo_actions
  if(undo_actions.length == 0) {
    console.log("Nothing to undo");
    return;
  }
  if(undo_actions.length == rerendered_after_action){
    console.log("Cannot undo past a rerender");
    alert("Cannot undo past a rerender.");
    return;
  }
  // Deselect the current selection, if any
  selected.forEach(toggle_selected);
  extraselected.forEach((x) => {toggle_selected(x,true);});

  [what,elems,sel,extra] = undo_actions.pop();
  if(what == "edges" || what == "relation" || what == "metarelation") {
    var added = elems;
    if(what == "relation")
      added.flat().forEach((x) => { 
        if(mei_graph.contains(x) && x.getAttribute("type") == "relation")
          for(var i = 0; i < draw_contexts.length; i++) 
            unmark_secondaries(draw_contexts[i],mei_graph,x)
      });
    // Remove added elements
    added.flat().forEach((x) => {
      if(!node_referred_to(x.getAttribute("xml:id")))
        x.parentNode.removeChild(x);
    });
    let id, type, g_elem = added.find((e) => e.tagName == "node" && e.getAttribute("type") == what);
    if(g_elem){
      id = g_elem.getAttribute("xml:id");
      if(g_elem.children.length > 0)
	type = g_elem.children[0].getAttribute("type");
    }
    // Select last selection
    sel.forEach((x) => {toggle_selected(x);});
    extra.forEach((x) => {toggle_selected(x,true);});
    redo_actions.push([what,[type,id],sel, extra]); 
  }else if( what == "delete relation" ) {
    var removed = elems;
    removed.forEach((x) => {
      x[1].insertBefore(x[0],x[2])
      let dc = draw_contexts.find((d) => d.svg_elem.contains(x[0]));
      let rel = get_class_from_classlist(x[0]) == "relation";
      if(dc && rel){
        let mei_id = get_id(x[0]);
        let mei_he = get_by_id(mei,mei_id);
        mark_secondaries(dc, mei_graph, mei_he)
      }
    });
    // Select last selection
    sel.forEach((x) => {toggle_selected(x);});
    extra.forEach((x) => {toggle_selected(x,true);});
    redo_actions.push([what,[],sel, extra]); 

  }else if (what == "change relation type") {
    var types = elems;
    let type = elems[0][1];
    sel.concat(extra).forEach((he) => {
      //TODO: move type_synonym application so that this
      //is the right type == the one from the MEI
      var [from,to] = types.pop();
      var id = id_or_oldid(he);
      var hes = [get_by_id(document,id)].concat(get_by_oldid(document,id));
      hes.forEach((he) => he.setAttribute("type",from));
      var mei_he = get_by_id(mei,id);
      mei_he.getElementsByTagName("label")[0].setAttribute("type",from);
      hes.forEach(toggle_shade);
    });
    sel.forEach((x) => {toggle_selected(x);});
    extra.forEach((x) => {toggle_selected(x,true);});
    redo_actions.push([what,type,sel, extra]); 
  }else if (what == "add note") {
    var [mei_elems,graphicals] = elems;
    graphicals.forEach((x) => x.parentNode.removeChild(x));
    let pname = mei_elems[0].getAttribute("pname");
    let oct = mei_elems[0].getAttribute("oct");
    let id = mei_elems[0].getAttribute("xml:id");
    let n = sel[0];
    mei_elems[0].parentNode.removeChild(mei_elems[0]);
    if(mei_elems.length > 1){
      var c = mei_elems[1];
      c.parentNode.insertBefore(c.children[0],c);
      c.parentNode.removeChild(c);
    }
    redo_actions.push([what,[pname,oct, n, id], sel, extra]); 
  }
  tooltip_update();
}

// Actually, let's redo that.
function do_redo() {
  // Get latest undo_actions
  if(redo_actions.length == 0) {
    console.log("Nothing to redo");
    return;
  }
  // Deselect the current selection, if any
  selected.forEach(toggle_selected);
  extraselected.forEach((x) => {toggle_selected(x,true);});

  [what,params,sel,extra] = redo_actions.pop();

  // Select the same things that were selected previously
  sel.forEach((x) => toggle_selected(document.getElementById(x.id)));
  extra.forEach((x) => {toggle_selected(document.getElementById(x.id),true);});

  let type, id;
  switch(what){
    case "relation":
      [type, id] = params;
      do_relation(type, id);
      break;
    case "metarelation":
      [type, id] = params;
      do_metarelation(type, id);
      break;
    case "change relation type":
      type = params;
      do_relation(type);
      break;
    case "delete relation":
      delete_relations();
      break;
    case "add note":
      let [pname, oct, note, nid] = params; 
      do_note(pname, oct, note, nid);
      toggle_selected(sel[0]);
      break;
  }
}



