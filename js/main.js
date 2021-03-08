// GLOBALS
// Load Verovio
var vrvToolkit = new verovio.toolkit();
var orig_svg;
var orig_mei;
var orig_mei_graph;
var orig_midi;
var orig_data;
// Clicking selects
var selected = [];
// Shift-clicking extra selects
var extraselected = [];
// This is our SVG
var svg;
var svg_elem;
// And the underlying MEI
var mei;
// And the graph node in the MEI
var mei_graph;
// And the MIDI
var midi;
// This is the MEI as text (pre-parse)
var data;
// We need a reader
var reader = new FileReader();
var filename;
// Did we change the MEI somehow?
var changes = false;
// Our undo stack. TODO: is this being empty the same as
// changes being false?
var undo_actions = [];

var redo_actions = []; //TODO, maybe?

// Each draw context contains information relevant to drawing
// into one of the SVG renders. In particular, we store
//  * The <div> element containing the SVG
//  * The MEI rendered, parsed into a DOM object
//  * The prefix used for the element IDs in the SVG (compared
//    to the MEI)
// The first element is the latest, shown at the top. 
var draw_contexts = [];

var rerendered_after_reduce = 0;

var non_notes_hidden = false;

var text_input=false;

var shades = false;

var format;

var zoom = 1;

var arg = false;

// Prevent unsaved data loss by warning user before browser unload events (reload, close).
// Attempting to do this in compliant fashion (https://html.spec.whatwg.org/#prompt-to-unload-a-document).
window.addEventListener("beforeunload", function (e) {
  var confirmationMessage = "Leave app? You may lose unsaved changes.";

  e.preventDefault();
  e.returnValue = confirmationMessage;
  return confirmationMessage;   // Some browsers don't follow the standard and require this.
});

// Once things are loaded, do configuration stuff
$(document).ready(function()
    {
      Object.keys(type_conf).forEach(init_type);
      Object.keys(meta_conf).forEach(meta_type);
      toggle_shades();
      $("#player").midiPlayer({ color: "grey", width: 250 });

    });

// Configured types need a button and a color each
function init_type(type) {
  console.debug("Using globals: document, shades_array, type_shades, type_keys, button_shades for conf");
  var elem = document.createElement("input");
  elem.setAttribute("type","button");
  elem.setAttribute("class","relationbutton");
  elem.setAttribute("id",type + "relationbutton");
  elem.setAttribute("value","Add "+type+" relation " + "(" + type_conf[type].key + ")");
  elem.onclick = () => {do_relation(type,arg);};
  $("#relation_buttons")[0].appendChild(elem);
  type_shades[type] = shades_array[type_conf[type].colour];
  type_keys[type_conf[type].key] = type;
  button_shades[type+"relationbutton"] = shades_array[type_conf[type].colour];
}

// Configured meta types need a button and a color each
function meta_type(type) {
  console.debug("Using globals: document, shades_array, meta_shades, meta_keys, button_shades for conf");
  var elem = document.createElement("input");
  elem.setAttribute("type","button");
  elem.setAttribute("class","metarelationbutton");
  elem.setAttribute("id",type + "metarelationbutton");
  elem.setAttribute("value","Add "+type+" metarelation " + "(" + meta_conf[type].key + ")");
  elem.onclick = () => {do_metarelation(type,arg);};
  $("#meta_buttons")[0].appendChild(elem);
  meta_shades[type] = shades_array[meta_conf[type].colour];
  meta_keys[meta_conf[type].key] = type;
  button_shades[type+"metarelationbutton"] = shades_array[meta_conf[type].colour];
}

// If we're selecting relations, we may want to change them.
function toggle_he_selected(selecting) {
  console.debug("Using globals: document for changing button texts/visibility");

  Array.from(document.getElementsByClassName("relationbutton")).forEach((button) => {
        var val = button.getAttribute("value");
        if(selecting)
          button.setAttribute("value",val.replace("Add","Set to"));
        else
          button.setAttribute("value",val.replace("Set to","Add"));
  });
  if(selecting)
    document.getElementById("meta_buttons").style.display="";
  else
    document.getElementById("meta_buttons").style.display="none";
}

// Toggle if a thing (for now: note or relation) is selected or not.
function toggle_selected(item,extra) { 
  console.debug("Using globals: selected, extraselected for adding/removing selected items. JQuery for changing displayed text of selected items");
  var ci = item.getAttribute("class");
  if(selected.length > 0 || extraselected.length > 0) {
    var csel = selected.concat(extraselected)[0].getAttribute("class");
    // Select only things of the same type for now - editing
    // relations to add things means deleting and re-adding
    if(ci != csel)
      return;
  }
  if(ci == "note"){
    // We're selecting notes.
    if(selected.find(x => x === item) || extraselected.find(x => x === item)) {
      item.style.fill = "black";
      selected = selected.filter(x =>  x !== item);
      extraselected = extraselected.filter(x =>  x !== item);
    } else {
      if(extra) {
        item.style.fill="red";
        extraselected.push(item);
      }else {
        item.style.fill ="green";
        selected.push(item);
      }
    }
  } else if(ci == "relation" || ci == "metarelation"){
    //Relation selection
    if(selected.concat(extraselected).length == 0){
      // We're beginning to select relations
      toggle_he_selected(true);
    }
    if(selected.find(x => x === item) || extraselected.find(x => x === item)) {
      item.style.fillOpacity = 0.5;
      item.style.strokeOpacity = 0.1;
      selected = selected.filter(x =>  x !== item);
      extraselected = extraselected.filter(x =>  x !== item);
      item.style.transform = "";
      item.style.filter = "";
    } else {
      if(extra){
        item.style.fillOpacity = 0.9;
        item.style.strokeOpacity = 0.8;
        extraselected.push(item);
        item.style.transform = "translate3d(0,0,0)";
        item.style.filter = "url(\"#extraFilter\")";
      }else{
        item.style.fillOpacity = 0.9;
        item.style.strokeOpacity = 0.8;
        selected.push(item);
        item.style.transform = "translate3d(0,0,0)";
        item.style.filter = "url(\"#selectFilter\")";
      }
    }
    if(selected.concat(extraselected).length == 0){
      // We're finished selecting relations
      toggle_he_selected(false);
    }
  }

  update_text();
}


function update_text(){
  var primaries, secondaries;
  if(arg){
    primaries = to_text_arg(draw_contexts,orig_mei_graph,extraselected);
    secondaries = to_text_arg(draw_contexts,orig_mei_graph,selected);
  }else{
    primaries = to_text(extraselected);
    secondaries = to_text(selected);
  }
  $("#selected_things").html("Primaries: "+primaries+"<br/>Secondaries: "+secondaries);  

}

// Toggle showing things other than notes in the score
function toggle_equalize() {
  console.debug("Using globals: non_notes_hidden");
  var hidden = "hidden";
  if(non_notes_hidden){
    hidden = "visible";
    non_notes_hidden = false;
  }else{
    non_notes_hidden = true;
  }
  set_non_note_visibility(hidden);
}

function set_non_note_visibility(hidden) {
  console.debug("Using globals: document for element selection");
  Array.from(document.getElementsByClassName("beam")).forEach((x) =>
      { Array.from(x.children).forEach((x) => { if(x.tagName == "polygon") { x.style.visibility= hidden; }})});
  hide_classes.forEach((cl) => {
    Array.from(document.getElementsByClassName(cl)).forEach((x) =>
        { x.style.visibility= hidden; });
  })
}


// Toggle the current relation having a type-dependent shade
// or not
function toggle_shade(he) {
  console.debug("Using globals: shades, type_shades, meta_shades, type_synonym");
  if(!shades && he.getAttribute("old_fill")){
    he.setAttribute("fill",he.getAttribute("old_fill"));
    he.removeAttribute("old_fill");
  }else if (shades && type_shades[he.getAttribute("type")]){
    he.setAttribute("old_fill", he.getAttribute("fill"));
    he.setAttribute("fill",type_shades[he.getAttribute("type")]);
  }else if (shades && meta_shades[he.getAttribute("type")]){
    he.setAttribute("old_fill", he.getAttribute("fill"));
    he.setAttribute("fill",meta_shades[he.getAttribute("type")]);
  }else if (shades && type_synonym[he.getAttribute("type")]){
    he.setAttribute("old_fill", he.getAttribute("fill"));
    he.setAttribute("fill",type_shades[type_synonym[he.getAttribute("type")]]);
  }
}

function toggle_button_shade(button) {
  console.debug("Using globals: shades, button_shades");
  if(shades) 
    button.style.color=button_shades[button.getAttribute("id")];
  else
    button.style.color="";
}

// Toggle type-dependent shades for relations and buttons
function toggle_shades() {
  console.debug("Using globals: shades, document for element selection");
  shades = !shades;
  Array.from(document.getElementsByClassName("relation")).forEach(toggle_shade);
  Array.from(document.getElementsByClassName("metarelation")).forEach(toggle_shade);
  Array.from(document.getElementsByClassName("relationbutton")).forEach(toggle_button_shade);
  Array.from(document.getElementsByClassName("metarelationbutton")).forEach(toggle_button_shade);
}

function delete_relation(elem) {
  console.debug("Using globals: mei for element selection");
  //Assume no meta-edges for now, meaning we only have to
  //remove the SVG elem, the MEI node, and any involved arcs
  var orig_mei_he,mei_he = get_by_id(mei,elem.id);
  unmark_secondaries(mei_he);
  
  var orig_arcs,arcs =
    Array.from(mei.getElementsByTagName("arc")).filter((arc) =>
      {
       return arc.getAttribute("to") == "#"+elem.id ||
              arc.getAttribute("from") == "#"+elem.id;
      });
  if(mei != orig_mei){
    orig_mei_he = get_by_id(mei,selected[0].id);
    orig_arcs =
      Array.from(mei.getElementsByTagName("arc")).filter((arc) =>
        {
         return arc.getAttribute("to") == "#"+elem.id ||
                arc.getAttribute("from") == "#"+elem.id;
        });
  }
  var removed = arcs.concat(orig_arcs).concat([elem,mei_he,orig_mei_he]);
  var action_removed = removed.map((x) => {if(x != undefined){
      var elems = [x,x.parentElement,x.nextSibling]; 
      x.parentElement.removeChild(x);
      return elems;
      }});

  return action_removed.reverse();
}

function delete_relations() {
  console.debug("Using globals: selected for element selection, undo_actions for storing the action");
  //Assume no meta-edges for now, meaning we only have to
  if(selected.length == 0 || selected[0].getAttribute("class") != "relation"){
    console.log("No relation selected!");
    return;
  }
  var removed = selected.flatMap(delete_relation);
  undo_actions.push(["delete relation",removed,selected,[]]);
  selected = [];
}



// This reduces away the relations where all the secondaries
// are not primary in any non-reduced relation. TODO: This, 
// while better than before, no doubt has room for optimisation
function do_reduce() {
  // Remember what's selected, and unselect it
  var sel = selected;
  var extra = extraselected;
  sel.concat(extra).forEach(toggle_selected);
  if(arg){
    console.debug("Using globals: undo_actions, draw_contexts, mei_graph, selected,  extraselected.");
    var undo = do_reduce_arg(draw_contexts[0], mei_graph, sel.concat(extra));
    undo_actions.push(["reduce",undo,sel,extra]);
    return;
  }
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
  if(sel.length > 0 && sel[0].getAttribute("class") == "relation"){
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

// OK we've selected stuff, let's make the selection into a
// "relation".
function do_relation(type,arg) {
    console.debug("Using globals: selected, extraselected, mei, orig_mei, undo_actions");
    if (selected.length == 0 && extraselected == 0) {
      return;}
    changes = true;
    var he_id, mei_elems;
    if(selected.concat(extraselected)[0].getAttribute("class") == "relation"){
      var types = [];
      if(arg){
        selected.concat(extraselected).forEach((he) => {
        //TODO: move type_synonym application so that this
        //is the right type == the one from the MEI
        types.push([he.getAttribute("type"),type]);
        var id = id_or_oldid(he);
        var hes = [get_by_id(document,id)].concat(get_by_oldid(document,id));
        hes.forEach((he) => he.setAttribute("type",type));
        var mei_he = get_by_id(orig_mei,id);
        mei_he.getElementsByTagName("label")[0].setAttribute("type",type);
        hes.forEach(toggle_shade);
        });
      }else{
        selected.concat(extraselected).forEach((he) => {
        //TODO: move type_synonym application so that this
        //is the right type == the one from the MEI
        types.push([he.getAttribute("type"),type]);
        he.setAttribute("type",type);
        var mei_he = get_by_id(mei,id_or_oldid(he));
        mei_he.getElementsByTagName("label")[0].setAttribute("type",type);
        toggle_shade(he);
        });
      }
      update_text();
      undo_actions.push(["change relation type",types.reverse(),selected,extraselected]);
    }else if(selected.concat(extraselected)[0].getAttribute("class") == "note"){
      var added = [];
      if(arg){
        // Add new nodes for all notes
        var primaries = extraselected.map((e) => add_mei_node_for_arg(orig_mei_graph,e));
        var secondaries = selected.map((e) => add_mei_node_for_arg(orig_mei_graph,e));
        added.push(primaries.concat(secondaries));
        [he_id,mei_elems] = add_relation_arg(orig_mei_graph,primaries, secondaries, type);
        added.push(mei_elems);
        console.log(get_by_id(orig_mei, he_id));
        for(var i = 0; i < draw_contexts.length; i++) {
          added.push(draw_relation_arg(draw_contexts[i],orig_mei_graph,get_by_id(orig_mei_graph.getRootNode(), he_id))); // Draw the edge
          mark_secondaries_arg(draw_contexts[i],orig_mei_graph,get_by_id(orig_mei_graph.getRootNode(),he_id));
        }
        undo_actions.push(["relation",added.reverse(),selected,extraselected]);
      }else{
        [he_id,mei_elems] = add_relation(mei,mei_graph,type);
        added.push(mei_elems);  // Add it to the MEI
        if(mei != orig_mei){
          var [orig_he_id,orig_mei_elems] = add_relation(orig_mei,orig_mei_graph,type,he_id);
          added.push(orig_mei_elems);  // Add it to the MEI
        }
        added.push(draw_relation(he_id,type)); // Draw the edge
        undo_actions.push(["relation",added,selected,extraselected]);
        mark_secondaries(get_by_id(mei,he_id));
      }
      
      selected.concat(extraselected).forEach(toggle_selected); // De-select
    }
}


function do_metarelation(type, arg ) {
    console.debug("Using globals: orig_mei, orig_mei_graph, selected, extraselected");
    if (selected.length == 0 && extraselected == 0) {
      return;}
    var ci =selected.concat(extraselected)[0].getAttribute("class"); 
    if(!(ci == "relation" || ci == "metarelation")){
      return; }
    changes = true;
    var added = [];
    var he_id,mei_elems;
    if(arg){

      var primaries = extraselected.map((e) =>
          get_by_id(orig_mei_graph.getRootNode(), id_or_oldid(e)));
      var secondaries = selected.map((e) =>
          get_by_id(orig_mei_graph.getRootNode(), id_or_oldid(e)));
      var [he_id,mei_elems] = add_metarelation_arg(orig_mei_graph, primaries, secondaries, type);
      added.push(mei_elems);
      for(var i = 0; i< draw_contexts.length; i++)
        added.push(draw_metarelation_arg(draw_contexts[i], orig_mei_graph, get_by_id(orig_mei_graph.getRootNode(),he_id))); // Draw the edge
    }else{
      var [he_id,mei_elems] = add_metarelation(mei,mei_graph,type);
      added.push(mei_elems);  // Add it to the MEI
      if(mei != orig_mei){
        var [orig_he_id,orig_mei_elems] = add_metarelation(orig_mei,orig_mei_graph,type,he_id);
        added.push(orig_mei_elems);  // Add it to the MEI
      }
      added.push(draw_metarelation(he_id,type)); // Draw the edge
    }
    
    undo_actions.push(["metarelation",added,selected,extraselected]);
    selected.concat(extraselected).forEach(toggle_selected); // De-select
}

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
          if(arg){
        if(orig_mei_graph.contains(x) && x.getAttribute("type") == "relation")
          for(var i = 0; i < draw_contexts.length; i++) 
            unmark_secondaries_arg(draw_contexts[i],orig_mei_graph,x)
          }else if(mei.contains(x) && x.getAttribute("type") == "relation")
          unmark_secondaries(x);
          });
      // Remove added elements
      added.flat().forEach((x) => {
          if(!node_referred_to(x.getAttribute("xml:id")))
            x.parentNode.removeChild(x);
          });
      // Select last selection
      sel.forEach((x) => {toggle_selected(x);});
      extra.forEach((x) => {toggle_selected(x,true);});
    }else if( what == "delete relation" ) {
      var removed = elems;
      removed.forEach((x) => {if(x) x[1].insertBefore(x[0],x[2])})
      selected = sel;
      selected.forEach(mark_secondaries);
    }else if (what == "change relation type") {
      var types = elems;
      sel.concat(extra).forEach((he) => {
          if(arg){
        //TODO: move type_synonym application so that this
        //is the right type == the one from the MEI
        var [from,to] = types.pop();
        var id = id_or_oldid(he);
        var hes = [get_by_id(document,id)].concat(get_by_oldid(document,id));
        hes.forEach((he) => he.setAttribute("type",from));
        var mei_he = get_by_id(orig_mei,id);
        mei_he.getElementsByTagName("label")[0].setAttribute("type",from);
        hes.forEach(toggle_shade);
          }else{
        //TODO: move type_synonym application so that this
        //is the right type == the one from the MEI
        var [from,to] = types.pop();
        he.setAttribute("type",from);
        var mei_he = get_by_id(mei,id_or_oldid(he));
        mei_he.getElementsByTagName("label")[0].setAttribute("type",from);
        toggle_shade(he);
          }
      });
      sel.forEach((x) => {toggle_selected(x);});
      extra.forEach((x) => {toggle_selected(x,true);});
    }else if (what == "reduce") {
      if(arg){
        var [relations,notes,graphicals] = elems;
        graphicals.flat().forEach((x) => { if(x) x.style.visibility = "visible";});
      } else{
        var reduce_layer = elems;
        reduce_layer.forEach((action) => {
          var [he,secondaries,graphicals] = action;
          graphicals.flat().forEach((x) => { if(x) x.style.visibility = "visible";});
        });
      }
      sel.forEach((x) => {toggle_selected(x);});
      extra.forEach((x) => {toggle_selected(x,true);});
    }


}


// We have keyboard commands!
function handle_keypress(ev) {
  console.debug("Using globals: text_input, meta_keys, type_keys");
  if(text_input)
    return;
  if (ev.key == "Enter"){
    do_edges();
  } else if (ev.key == "u") { // UNDO
    do_undo();
  } else if (ev.key == "r") { // Reduce relations
    do_reduce();
  } else if (ev.key == "s") { // Show/hide ties etc.
    toggle_equalize();
  } else if (ev.key == "h") { // Toggle type-dependent shades
    toggle_shades();
  } else if (ev.key == "+") { // Select same notes in the measure
    select_samenote();
    do_relation("repeat",arg);
  } else if (type_keys[ev.key]) { // Add a relation
    do_relation(type_keys[ev.key],arg);
  } else if (meta_keys[ev.key]) { // Add a relation
    do_metarelation(meta_keys[ev.key],arg);
  }else {
    console.log(ev);
  }
}

// Function to download data to a file
// Taken from StackOverflow answer by Kanchu at
// https://stackoverflow.com/questions/13405129/javascript-create-and-save-file
function download(data, filename, type) {
    console.debug("Using globals: document, window");
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}

// If the MEI already has a graph, we add on to that. TODO:
// Check that the graph is actually our kind of graph
function add_or_fetch_graph() {
  console.debug("Using globals: mei");
  var existing = mei.getElementsByTagName("graph");
  if(existing.length) {
    // TODO: Not just grab the first one.
    return existing[0];
  }
  var elem = mei.createElement("graph");
  elem.setAttribute("type","directed");
  mei.getElementsByTagName("body")[0].appendChild(elem);
  return elem;
}

// An option to download the MEI with the changes we've made
function save() {
  console.debug("Using globals: mei");
  var saved = new XMLSerializer().serializeToString(mei);
  download(saved, filename+".mei", "text/xml");
}
function save_orig() {
  console.debug("Using globals: orig_mei");
  var saved = new XMLSerializer().serializeToString(orig_mei);
  download(saved, filename+".mei", "text/xml");
}

// Download the current SVG, including graph elements
function savesvg() {
  var saved = new XMLSerializer().serializeToString($("#svg_output")[0]);
  download(saved, filename+".svg", "text/xml");
}

// Load a new MEI
function load() {
  console.debug("Using globals: selected_extraselected, upload, reader, filenmae");
  /* Cancel loading if changes are not saved? alert */
  selected = [];
  extraselected = [];
  upload = document.getElementById("fileupload");
  if(upload.files.length == 1){
    reader.onload = function (e) {
      data = reader.result;
      load_finish();
    }
    reader.readAsText(upload.files[0]);
    filename = upload.files[0].name.split(".").slice(0,-1).join(".");
    if(filename == "")
      filename = upload.files[0].name;
  }else{
    return;
  }
}


// Draw the existing graph
function draw_graph() {
  console.debug("Using globals: mei_graph, mei, selected, extraselected, document");
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

// Do all of this when we have the MEI in memory
function load_finish(e) {
  console.debug("Using globals data, parser, mei, format, svg, svg_elem, jquery document, document, mei_graph, midi, orig_*, changes, undo_cations, redo_actions, reduce_actions, rerendered_after_action, shades");
  parser = new DOMParser();
  mei = parser.parseFromString(data,"text/xml");
  format = "mei";
  if(mei.documentElement.namespaceURI != "http://www.music-encoding.org/ns/mei")
    // We didn't get a MEI? Try if it's a musicXML
    format = "musicxml";
  else
    mei = fix_synonyms(mei);

  svg = vrvToolkit.renderData(data, {pageWidth: 20000,
      pageHeight: 10000, breaks: "none", format: format});
  if (!svg) {
    console.log ('Verovio could not generate SVG.');
    return false;
  }
  $("#svg_outputs").html('<div id="svg_output0"></div>')
  $("#svg_output0").html(svg);
  svg_elem = document.getElementById("svg_output0");
  if(format == "musicxml"){
    data = vrvToolkit.getMEI();
    parser = new DOMParser();
    mei = parser.parseFromString(data,"text/xml");
  }

  mei_graph = add_or_fetch_graph();
  midi = vrvToolkit.renderToMIDI();
  orig_mei = mei;
  orig_data = data;
  orig_mei_graph = mei_graph;
  orig_svg = svg;
  orig_midi = midi;

  draw_contexts = [{"mei" : mei,
                    "svg_elem" : svg_elem,
                    "id_prefix" : ""}];

  draw_graph();

  changes = false;
  undo_actions = [];
  redo_actions = []; //TODO, maybe?
  reduce_actions = [];

  rerendered_after_action = 0;

  for (let n of document.getElementsByClassName("note")) {
      //n.addEventListener('click', function(ev) {toggle_selected(n,ev.shiftKey) } )
      n.onclick = function(ev) {toggle_selected(n,ev.shiftKey) };
  }
  for (let h of document.getElementsByClassName("relation")) {
      h.onclick = function(ev) {toggle_selected(h,ev.shiftKey) };
      //h.addEventListener('click', function(ev) {toggle_selected(h,ev.shiftKey) } )
  }
  if(!shades)
    toggle_shades();
  document.onkeypress = function(ev) {handle_keypress(ev);};
  return true;
}



function rerender_mei(replace_with_rests = false) {
  console.debug("Using globals mei, svg_elem");
  var mei2 = mei.implementation.createDocument(
        mei.documentElement.namespaceURI, //namespace to use
        null,             //name of the root element (or for empty document)
        null              //doctype (null for XML)
        );
  var newNode = mei2.importNode(
      mei.documentElement, //node to import
      true                 //clone its descendants
      );
  mei2.appendChild(newNode);

  Array.from(svg_elem.getElementsByClassName("note")).forEach((x) => {
    if(x.style.visibility == "hidden"){
      //TODO: this is wrong
      // 
      var y = get_by_id(mei2,x.getAttribute("id"));
      var paren = y.parentNode;
      // TODO: deal properly with tremolos
      // TODO
      if(replace_with_rests && !["chord","bTrem","fTrem"].includes(paren.tagName)) {
        // Add a rest
        var rest = mei2.createElementNS("http://www.music-encoding.org/ns/mei", 'rest');
        rest.setAttribute("xml:id","rest-"+y.getAttribute("xml:id"));
        rest.setAttribute("dur",y.getAttribute("dur"));
        rest.setAttribute("n",y.getAttribute("n"));
        rest.setAttribute("dots",y.getAttribute("dots"));
        rest.setAttribute("when",y.getAttribute("when"));
        rest.setAttribute("layer",y.getAttribute("layer"));
        rest.setAttribute("staff",y.getAttribute("staff"));
        rest.setAttribute("tstamp.ges",y.getAttribute("tstamp.ges"));
        rest.setAttribute("tstamp.real",y.getAttribute("tstamp.real"));
        rest.setAttribute("tstamp",y.getAttribute("tstamp"));
        rest.setAttribute("loc",y.getAttribute("loc"));
        rest.setAttribute("dur.ges",y.getAttribute("dur.ges"));
        rest.setAttribute("dots.ges",y.getAttribute("dots.ges"));
        rest.setAttribute("dur.metrical",y.getAttribute("dur.ges"));
        rest.setAttribute("dur.ppq",y.getAttribute("dur.ppq"));
        rest.setAttribute("dur.real",y.getAttribute("dur.real"));
        rest.setAttribute("dur.recip",y.getAttribute("dur.recip"));
        rest.setAttribute("beam",y.getAttribute("beam"));
        rest.setAttribute("fermata",y.getAttribute("fermata"));
        rest.setAttribute("tuplet",y.getAttribute("tuplet"));
        //That's all I can think of. There's probably a better
        //way to do this..
        paren.insertBefore(rest,y);
      }
      paren.removeChild(y);
    }
  });
  Array.from(mei2.getElementsByTagName("chord")).forEach((x) =>
    {
    var paren = x.parentNode;
    if(x.getElementsByTagName("note").length == 0){
      x.parentNode.removeChild(x);
    }
    });

  return mei2;

}

function rerender() {
  console.debug("Using globals document, svg_elem, jquery document, svg, mei, data, mei_graph, non_notes_hidden, rerendered_after_action, undo_actions")
  // Create new SVG element, stack the current version on
  // it..? No I have no idea how to UI this properly.
  var output_parent = document.getElementById("svg_outputs");
  var new_svg_elem = document.createElement("div");
  var old_svg_elem = svg_elem;
  new_svg_elem.setAttribute("id","svg_output" + output_parent.children.length);
  output_parent.prepend(new_svg_elem);

  var mei2 = rerender_mei();
  var data2 = new XMLSerializer().serializeToString(mei2);

  var svg2 = vrvToolkit.renderData(data2, {pageWidth: 20000,
      pageHeight: 10000, breaks: "none", format: "mei"});

  draw_contexts[0].id_prefix = "old"+(output_parent.children.length-2);
  prefix_ids(old_svg_elem,draw_contexts[0].id_prefix);
  
  $(new_svg_elem).html(svg2);
  var new_draw_context = {"mei": mei2, "svg_elem" : new_svg_elem,
    "id_prefix" : ""};
  draw_contexts.reverse();
  draw_contexts.push(new_draw_context);
  draw_contexts.reverse();
  svg = svg2;
  mei = mei2;
  data = data2;
  svg_elem = new_svg_elem;
  mei_graph = add_or_fetch_graph();
  for (let n of document.getElementsByClassName("note")) {
      n.onclick= function(ev) {toggle_selected(n,ev.shiftKey) };
  }
  if(non_notes_hidden)
    set_non_note_visibility("hidden");
  // Need also to redraw edges and relations
  draw_graph();

  // Can't undo after a rerender.. yet, TODO: Make layers
  rerendered_after_action=undo_actions.length;
  // This is one of the ugliest hacks I've made I think
  var reduces = undo_actions.filter((x) => { return x[0] == "reduce";});
  undo_actions = [];
  reduces.forEach((action) => {selected = action[2]; do_reduce();})
}

function texton() { text_input = true; }
function textoff() { text_input = false; }
function show_buttons() {
  $("#load_save")[0].style.display="";
  $("#hidden_buttons")[0].style.display="none";
}
function hide_buttons() {
  $("#load_save")[0].style.display="none";
  $("#hidden_buttons")[0].style.display="";
}

function zoom_in() {
  zoom = zoom * 1.1;
  $("#svg_outputs")[0].style.transform="scale("+zoom+")";
}
function zoom_out() {
  zoom = zoom * 0.90909090909090;
  $("#svg_outputs")[0].style.transform="scale("+zoom+")";
}


function do_deselect() {
  selected.forEach((x) => toggle_selected(x));
  extraselected.forEach((x) => toggle_selected(x,true));
}

function play_midi() {
  $("#player").midiPlayer.play("data:audio/midi;base64,"+orig_midi);
}

function play_midi_reduction() {
  var mei2 = rerender_mei(true);
  var data2 = new XMLSerializer().serializeToString(mei2);
  vrvToolkit.loadData(data2);
  $("#player").midiPlayer.play("data:audio/midi;base64,"+vrvToolkit.renderToMIDI());
  vrvToolkit.loadData(data);

}

console.log("Main webapp library is loaded");
