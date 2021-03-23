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

var layer_contexts = [];

var rerendered_after_reduce = 0;

var non_notes_hidden = false;

var text_input=false;

var shades = false;

var format;

var zoom = 1;

var arg = true;

var mouseX;
var mouseY;

window.onmousemove = (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;

}


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

  // Global `.shift-pressed` class for pretty (meta-)relation styling on hover.
  $('body').on({
    keydown: function(e) {
        if (e.originalEvent.key === "Shift")
        $('#svg_outputs').addClass('shift-pressed')
      },
      keyup: function(e) {
        if (e.originalEvent.key === "Shift")
        $('#svg_outputs').removeClass('shift-pressed')
      }
  });
});

// Configured types need a button and a color each
function init_type(type) {
  console.debug("Using globals: document, shades_array, type_shades, type_keys, button_shades for conf");
  var elem = document.createElement("input");
  elem.setAttribute("type","button");
  elem.classList.add("relationbutton");
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
  elem.classList.add("metarelationbutton");
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
  var ci = get_class_from_classlist(item);
  if(selected.length > 0 || extraselected.length > 0) {
    var csel = get_class_from_classlist(selected.concat(extraselected)[0]);
    // Select only things of the same type for now - editing
    // relations to add things means deleting and re-adding
    if(ci != csel)
      return;
  }
  if(ci == "note"){
    // We're selecting notes.
    if(selected.find(x => x === item) || extraselected.find(x => x === item)) {
      item.classList.remove("selectednote");
      item.classList.remove("extraselectednote");
      selected = selected.filter(x =>  x !== item);
      extraselected = extraselected.filter(x =>  x !== item);
    } else {
      if(extra) {
	item.classList.add("extraselectednote");
        extraselected.push(item);
      }else {
	item.classList.add("selectednote");
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
      item.classList.remove("extraselectedrelation");
      item.classList.remove("selectedrelation");
      selected = selected.filter(x =>  x !== item);
      extraselected = extraselected.filter(x =>  x !== item);
    } else {
      if(extra){
	item.classList.add("extraselectedrelation");
        extraselected.push(item);
      }else{
	item.classList.add("selectedrelation");
        selected.push(item);
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
  non_notes_hidden = !non_notes_hidden;
  set_non_note_visibility(non_notes_hidden);
}

function set_non_note_visibility(hidden) {
  console.debug("Using globals: document for element selection");
  Array.from(document.getElementsByClassName("beam")).forEach((x) =>
      { Array.from(x.children).forEach((x) => { if(x.tagName == "polygon")
	  { hidden ? x.classList.add("hidden") : x.classList.remove("hidden"); }})});
  hide_classes.forEach((cl) => {
    Array.from(document.getElementsByClassName(cl)).forEach((x) =>
	{ hidden ? x.classList.add("hidden") : x.classList.remove("hidden");})});
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
      // If x corresponds to an SVG note (try!), un-style it as if we were not hovering over the relation.
      // This is necessary when deleting via they keyboard (therefore while hovering).
      try {
        $(`g #${x.getAttribute('to').substring(4)}`).removeClass().addClass('note');
      } catch (e) {
      }
      x.parentElement.removeChild(x);
      return elems;
      }});

  return action_removed.reverse();
}

function delete_relations() {
  console.debug("Using globals: selected for element selection, undo_actions for storing the action");
  //Assume no meta-edges for now, meaning we only have to
  if(selected.length == 0 || get_class_from_classlist(selected[0]) != "relation"){
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
    undo = do_reduce_arg(draw_contexts[0], mei_graph, sel, extra);
    return;
  }
  do_reduce_old(sel,extra);
}


// OK we've selected stuff, let's make the selection into a
// "relation".
function do_relation(type,arg) {
    console.debug("Using globals: selected, extraselected, mei, orig_mei, undo_actions");
    if (selected.length == 0 && extraselected == 0) {
      return;}
    changes = true;
    var he_id, mei_elems;
    if(arg){
    if(selected.concat(extraselected)[0].classList.contains("relation")){
      var types = [];
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
      update_text();
      undo_actions.push(["change relation type",types.reverse(),selected,extraselected]);
    }else if(selected.concat(extraselected)[0].classList.contains("note")){
      var added = [];
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
      selected.concat(extraselected).forEach(toggle_selected); // De-select
    }
    }else
      do_relation_old(type,arg);
}


function do_metarelation(type, arg ) {
    console.debug("Using globals: orig_mei, orig_mei_graph, selected, extraselected");
    if (selected.length == 0 && extraselected == 0) {
      return;}
    var ci = get_class_from_classlist(selected.concat(extraselected)[0]); 
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

function undo_reduce() {
  undo_actions.reverse();
  var ix = undo_actions.findIndex((t) => t[0] == "reduce");
  if(ix == -1){
    undo_actions.reverse();
    return;
  }
  undo = undo_actions[ix];
  undo_actions[ix] = null;
  undo_actions = undo_actions.filter((x) => x != null);
  undo_actions.reverse();
  undo_actions.push(undo);
  do_undo();
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
        graphicals.flat().forEach((x) => { if(x) x.classList.remove("hidden");});
      } else{
        var reduce_layer = elems;
        reduce_layer.forEach((action) => {
          var [he,secondaries,graphicals] = action;
          graphicals.flat().forEach((x) => { if(x) x.classList.remove("hidden");});
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
  } else if (ev.key == "z") { // Scroll through relations
    elem = document.elementFromPoint(mouseX, mouseY);
    flip_to_bg(elem);
    elem.onmouseout();
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
  } else if (ev.key == "d") { // Deselect all.
    do_deselect();
  } else if (ev.key == "D") { // Delete relations.
    delete_relations();
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
function draw_graph(draw_context) {
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
  if(arg) {
    relations_nodes.forEach((g_elem) => draw_relation_arg(draw_context,mei_graph,g_elem));
    metarelations_nodes.forEach((g_elem) => draw_metarelation_arg(draw_context,mei_graph,g_elem));
    return;
  }
  draw_graph_old(draw_context);
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
  svg_elem.classList.add("svg_output");
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
                    // TODO: One draw context per existing score element
		    // already on load.
                    "mei_score" : mei.getElementsByTagName("score")[0],
                    "svg_elem" : svg_elem,
                    "id_prefix" : "",
                    "reductions" : []}];

  if(arg){
    var new_draw_context = draw_contexts[0];
    var reducebutton = document.createElement("input");
    var undobutton = document.createElement("input");
    var rerenderbutton = document.createElement("input");
    reducebutton.setAttribute("type","button");
    reducebutton.setAttribute("value","Reduce");
    undobutton.setAttribute("type","button");
    undobutton.setAttribute("value","Unreduce");
    rerenderbutton.setAttribute("type","button");
    rerenderbutton.setAttribute("value","Create new view");
    reducebutton.onclick =   () =>{  do_reduce_pre(new_draw_context);}
    undobutton.onclick =     () =>{undo_reduce_arg(new_draw_context);}
    rerenderbutton.onclick = () =>{   rerender_arg(new_draw_context);}
    svg_elem.insertBefore(undobutton,    svg_elem.children[0]);
    svg_elem.insertBefore(reducebutton,  svg_elem.children[0]);
    svg_elem.insertBefore(rerenderbutton,svg_elem.children[0]);
  }
  draw_graph(draw_contexts[0]);

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



function rerender_mei(replace_with_rests = false, draw_context = draw_contexts[0]) {
  console.debug("Using globals mei, svg_elem");
  var mei = draw_context.mei;
  var svg_elem = draw_context.svg_elem;
  var mei2 = clone_mei(mei)

  Array.from(mei2.getElementsByTagName("note")).forEach((n) => {
    x = svg_find_from_mei_elem(svg_elem, draw_context.id_prefix, n);
    if(x == null || x.classList.contains("hidden")){
      //TODO: this is wrong
      // 
      var paren = n.parentNode;
      // TODO: deal properly with tremolos
      // TODO
      if(replace_with_rests && !["chord","bTrem","fTrem"].includes(paren.tagName)) {
        // Add a rest
        var rest = note_to_rest(mei2,n)
        paren.insertBefore(rest,n);
      }
      paren.removeChild(n);
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

function rerender_arg(draw_context) {
  var new_svg_elem = document.createElement("div");
  var old_svg_elem = draw_context['svg_elem'];
  var output_parent = old_svg_elem.parentElement;
  new_svg_elem.setAttribute("id","svg_output" + document.getElementsByClassName("svg_output").length);
  output_parent.insertBefore(new_svg_elem, old_svg_elem);
  var mei2 = rerender_mei(false, draw_context);
  var data2 = new XMLSerializer().serializeToString(mei2);

  var svg2 = vrvToolkit.renderData(data2, {pageWidth: 20000,
      pageHeight: 10000, breaks: "none", format: "mei"});

  draw_context.id_prefix = "old"+(output_parent.children.length-2);
  prefix_ids(old_svg_elem,draw_context.id_prefix);
  
  $(new_svg_elem).html(svg2);
  new_svg_elem.classList.add("svg_output");
  var new_draw_context = {"mei": mei, "svg_elem" : new_svg_elem,
    "id_prefix" : "", reductions: []};

  var reducebutton = document.createElement("input");
  var undobutton = document.createElement("input");
  var rerenderbutton = document.createElement("input");
  reducebutton.setAttribute("type","button");
  reducebutton.setAttribute("value","Reduce");
  undobutton.setAttribute("type","button");
  undobutton.setAttribute("value","Unreduce");
  rerenderbutton.setAttribute("type","button");
  rerenderbutton.setAttribute("value","Create new view");
  reducebutton.onclick =   () =>{  do_reduce_pre(new_draw_context);}
  undobutton.onclick =     () =>{undo_reduce_arg(new_draw_context);}
  rerenderbutton.onclick = () =>{   rerender_arg(new_draw_context);}
  new_svg_elem.insertBefore(undobutton,    new_svg_elem.children[0]);
  new_svg_elem.insertBefore(reducebutton,  new_svg_elem.children[0]);
  new_svg_elem.insertBefore(rerenderbutton,new_svg_elem.children[0]);
  draw_contexts.reverse();
  draw_contexts.push(new_draw_context);
  draw_contexts.reverse();
  for (let n of document.getElementsByClassName("note")) {
      n.onclick= function(ev) {toggle_selected(n,ev.shiftKey) };
  }
  draw_graph(new_draw_context);
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
  var new_draw_context = {"mei": mei, "mei_score": draw_contexts[0].mei_score, "svg_elem" : new_svg_elem, "id_prefix" : "", reductions: []};
  svg = svg2;
  data = data2;
  svg_elem = new_svg_elem;
  for (let n of document.getElementsByClassName("note")) {
      n.onclick= function(ev) {toggle_selected(n,ev.shiftKey) };
  }
  if(non_notes_hidden)
    set_non_note_visibility("hidden");
  draw_contexts.reverse();
  draw_contexts.push(new_draw_context);
  draw_contexts.reverse();
  // Need also to redraw edges and relations
  draw_graph(new_draw_context);

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
