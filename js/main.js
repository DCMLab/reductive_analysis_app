// GLOBALS
// Load Verovio
var vrvToolkit = new verovio.toolkit();
// Clicking selects
var selected = [];
// Shift-clicking extra selects
var extraselected = [];
// And the underlying MEI
var mei;
// And the graph node in the MEI
var mei_graph;
// And the MIDI
var midi;
var orig_midi;
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
//  * The outer <div> element that also contains the view-specific buttons
//  and controls
//  * The amount of zoom (should be moved to style?)
//  * The stack of local reduce actions
//  * The layer context to which this view belongs
//  * The prefix used for the element IDs in the SVG (compared
//    to the MEI)
// The first element is the latest
var draw_contexts = [];

var current_draw_context;

// Each layer context contains information relevant to the layer, such as
//  * The rendered MEI
//  * The score element in the original MEI
//  * The <div> element containing the layer
//  * A mapping from each element in the layer score element to its
//  canonical representative
var layer_contexts = [];

var non_notes_hidden = false;

var text_input=false;

var shades = false;

// Hovering and adding notes
var placing_note="";

var mouseX;
var mouseY;

window.onmousemove = (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  // Not sure if this is the best way...
  var elem = document.elementFromPoint(mouseX, mouseY);
  var dc = draw_contexts.find((dc) => dc.view_elem.contains(elem));
  if(dc)
    current_draw_context = dc;
  if(placing_note!=""){
    update_placing_note();
  }
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
      $("#selected_things").hide();


});

// Configured types need a button and a color each
function init_type(type) {
  console.debug("Using globals: document, shades_array, type_shades, type_keys, button_shades for conf");
  var elem = document.createElement("input");
  elem.setAttribute("type","button");
  elem.classList.add("relationbutton");
  elem.setAttribute("id",type + "relationbutton");
  elem.setAttribute("value","Add "+type+" relation " + "(" + type_conf[type].key + ")");
  elem.onclick = () => {do_relation(type);};
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
  elem.onclick = () => {do_metarelation(type);};
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
    document.getElementById("meta_buttons").classList.remove("none");
  else
    document.getElementById("meta_buttons").classList.add("none");
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
    primaries = to_text(draw_contexts,mei_graph,extraselected);
    secondaries = to_text(draw_contexts,mei_graph,selected);
  if (primaries || secondaries) {
    $("#selected_things").show();
    $("#selected_things").html("<span class='selected_primaries'>Primaries: </span>"+primaries+"<br/><span class='selected_secondaries'>Secondaries: </span>"+secondaries);  
  } else {
    $("#selected_things").hide();
  }
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
  var mei_id = get_id(elem);
  var mei_he = get_by_id(mei,mei_id);
  var svg_hes = [];
  for(draw_context of draw_contexts){
    let svg_he = get_by_id(document,draw_context.id_prefix + mei_id);
    if(svg_he){
      unmark_secondaries(draw_context, mei_graph, mei_he);
      svg_hes.push(svg_he);
    }
  }

  
  var arcs =
    Array.from(mei.getElementsByTagName("arc")).filter((arc) =>
      {
       return arc.getAttribute("to") == "#"+elem.id ||
              arc.getAttribute("from") == "#"+elem.id;
      });
  var removed = arcs.concat(svg_hes);
  removed.push(mei_he);
  var action_removed = removed.map((x) => {
      var elems = [x,x.parentElement,x.nextSibling]; 
      // If x corresponds to an SVG note (try!), un-style it as if we were not hovering over the relation.
      // This is necessary when deleting via they keyboard (therefore while hovering).
      try {
        $(`g #${x.getAttribute('to').substring(4)}`).removeClass().addClass('note');
      } catch (e) {
      }
      x.parentElement.removeChild(x);
      return elems;
    });

  return action_removed;
}

function delete_relations() {
  console.debug("Using globals: selected for element selection, undo_actions for storing the action");
  //Assume no meta-edges for now, meaning we only have to
  var sel = selected.concat(extraselected);
  if(sel.length == 0 || get_class_from_classlist(sel[0]) != "relation"){
    console.log("No relation selected!");
    return;
  }
  var removed = sel.flatMap(delete_relation);
  undo_actions.push(["delete relation",removed.reverse(),selected,extraselected]);
  sel.forEach(toggle_selected);
}



// OK we've selected stuff, let's make the selection into a
// "relation".
function do_relation(type) {
    console.debug("Using globals: selected, extraselected, mei, orig_mei, undo_actions");
    if (selected.length == 0 && extraselected == 0) {
      return;}
    changes = true;
    var he_id, mei_elems;
    if(selected.concat(extraselected)[0].classList.contains("relation")){
      var types = [];
        selected.concat(extraselected).forEach((he) => {
        //TODO: move type_synonym application so that this
        //is the right type == the one from the MEI
        types.push([he.getAttribute("type"),type]);
        var id = id_or_oldid(he);
        var hes = [get_by_id(document,id)].concat(get_by_oldid(document,id));
        hes.forEach((he) => he.setAttribute("type",type));
        var mei_he = get_by_id(mei,id);
        mei_he.getElementsByTagName("label")[0].setAttribute("type",type);
        hes.forEach(toggle_shade);
        });
      update_text();
      undo_actions.push(["change relation type",types.reverse(),selected,extraselected]);
    }else if(selected.concat(extraselected)[0].classList.contains("note")){
      var added = [];
        // Add new nodes for all notes
        var primaries = extraselected.map((e) => add_mei_node_for(mei_graph,e));
        var secondaries = selected.map((e) => add_mei_node_for(mei_graph,e));
        added.push(primaries.concat(secondaries));
        [he_id,mei_elems] = add_relation(mei_graph,primaries, secondaries, type);
        added.push(mei_elems);
        for(var i = 0; i < draw_contexts.length; i++) {
          added.push(draw_relation(draw_contexts[i],mei_graph,get_by_id(mei_graph.getRootNode(), he_id))); // Draw the edge
          mark_secondaries(draw_contexts[i],mei_graph,get_by_id(mei_graph.getRootNode(),he_id));
        }
        undo_actions.push(["relation",added.reverse(),selected,extraselected]);
      selected.concat(extraselected).forEach(toggle_selected); // De-select
    }
}


function do_metarelation(type) {
    console.debug("Using globals: orig_mei, mei_graph, selected, extraselected");
    if (selected.length == 0 && extraselected == 0) {
      return;}
    var ci = get_class_from_classlist(selected.concat(extraselected)[0]); 
    if(!(ci == "relation" || ci == "metarelation")){
      return; }
    changes = true;
    var added = [];
    var he_id,mei_elems;

      var primaries = extraselected.map((e) =>
          get_by_id(mei_graph.getRootNode(), id_or_oldid(e)));
      var secondaries = selected.map((e) =>
          get_by_id(mei_graph.getRootNode(), id_or_oldid(e)));
      var [he_id,mei_elems] = add_metarelation(mei_graph, primaries, secondaries, type);
      added.push(mei_elems);
      for(var i = 0; i< draw_contexts.length; i++)
        added.push(draw_metarelation(draw_contexts[i], mei_graph, get_by_id(mei_graph.getRootNode(),he_id))); // Draw the edge
    
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
        if(mei_graph.contains(x) && x.getAttribute("type") == "relation")
          for(var i = 0; i < draw_contexts.length; i++) 
            unmark_secondaries(draw_contexts[i],mei_graph,x)
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
      removed.forEach((x) => {
	  x[1].insertBefore(x[0],x[2])
	  let dc = draw_contexts.find((d) => d.svg_elem.contains(x[0]));
	  if(dc){
	    let mei_id = get_id(x[0]);
	    let mei_he = get_by_id(mei,mei_id);
	    mark_secondaries(dc, mei_graph, mei_he)
	  }
	});
      // Select last selection
      sel.forEach((x) => {toggle_selected(x);});
      extra.forEach((x) => {toggle_selected(x,true);});

    }else if (what == "change relation type") {
      var types = elems;
      sel.concat(extra).forEach((he) => {
        //TODO: move type_synonym application so that this
        //is the right type == the one from the MEI
        var [from,to] = types.pop();
        var id = id_or_oldid(he);
        var hes = [get_by_id(document,id)].concat(get_by_oldid(document,id));
        hes.forEach((he) => he.setAttribute("type",from));
        var mei_he = get_by_id(orig_mei,id);
        mei_he.getElementsByTagName("label")[0].setAttribute("type",from);
        hes.forEach(toggle_shade);
      });
      sel.forEach((x) => {toggle_selected(x);});
      extra.forEach((x) => {toggle_selected(x,true);});
    }else if (what == "reduce") {
        var [relations,notes,graphicals] = elems;
        graphicals.flat().forEach((x) => { if(x) x.classList.remove("hidden");});
      sel.forEach((x) => {toggle_selected(x);});
      extra.forEach((x) => {toggle_selected(x,true);});
    }else if (what == "add note") {
      var [mei_elems,graphicals] = elems;
      graphicals.forEach((x) => x.parentNode.removeChild(x));
      mei_elems[0].parentNode.removeChild(mei_elems[0]);
      if(mei_elems.length > 1){
	var c = mei_elems[1];
	c.parentNode.insertBefore(c.children[0],c);
	c.parentNode.removeChild(c);
      }
    }



}

function handle_keydown(ev) {
  if(ev.key=="Control"){
    start_placing_note();
  }
  // Global `.shift-pressed` class for pretty (meta-)relation styling on hover.
  if (ev.key === "Shift")
    $('#layers').addClass('shift-pressed')
}

function handle_keyup(ev) {
  if(ev.key=="Control"){
    stop_placing_note();
  }
  // Global `.shift-pressed` class for pretty (meta-)relation styling on hover.
  if (ev.key === "Shift")
    $('#layers').removeClass('shift-pressed')
}

function handle_click(ev) {
  place_note();
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
    do_relation("repeat");
  } else if (ev.key == "x") { // Select same notes in the measure
    toggle_placing_note();
  } else if (ev.key == "d") { // Deselect all.
    do_deselect();
  } else if (ev.key == "D") { // Delete relations.
    delete_relations();
  } else if (type_keys[ev.key]) { // Add a relation
    do_relation(type_keys[ev.key]);
  } else if (meta_keys[ev.key]) { // Add a relation
    do_metarelation(meta_keys[ev.key]);
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
  var saved = new XMLSerializer().serializeToString(mei);
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
  //var mei = draw_context.mei;
  //var mei_graph = mei.getElementsByTagName("graph")[0];
  // There's a multi-stage process to get all the info we
  // need... First we get the nodes from the graph element.
  var nodes_array = Array.from(mei_graph.getElementsByTagName("node"));
  // Get the nodes representing relations
  var relations_nodes = nodes_array.filter((x) => { return x.getAttribute("type") == "relation";})
  // Get the nodes representing metarelations
  var metarelations_nodes = nodes_array.filter((x) => { return x.getAttribute("type") == "metarelation";})
    relations_nodes.forEach((g_elem) => {
	      if(draw_relation(draw_context,mei_graph,g_elem))
		mark_secondaries(draw_context,mei_graph,g_elem);
	  })
    metarelations_nodes.forEach((g_elem) => draw_metarelation(draw_context,mei_graph,g_elem));
}


function new_layer_element() {
  var layers_element = document.getElementById("layers");
  var new_layer = document.createElement("div");
  new_layer.id = "layer"+layers_element.children.length;
  new_layer.classList.add("layer");
  layers_element.appendChild(new_layer);
  return new_layer;
}

function new_view_elements(layer_element) {
  var new_view = document.createElement("div");
  new_view.id = "view"+draw_contexts.length;
  new_view.classList.add("view");
  var new_svg = document.createElement("div");
  new_svg.id = "svg"+draw_contexts.length;
  new_svg.classList.add("svg_container");
  new_view.appendChild(new_svg);
  layer_element.appendChild(new_view);
  return [new_view,new_svg];
}

function button(value) {
  var button = document.createElement("input");
  button.setAttribute("type","button");
  button.setAttribute("value",value);
  return button;
}


function add_buttons(draw_context) {
    var new_draw_context = draw_context;
    var buttondiv = document.createElement("div");
    buttondiv.classList.add("view_buttons");
    var newlayerbutton = button("Create new layer");
    newlayerbutton.classList.add("newlayerbutton");
    newlayerbutton.id = (draw_context.id_prefix+"newlayerbutton");
    var reducebutton = button("Reduce");
    reducebutton.classList.add("reducebutton");
    reducebutton.id = (draw_context.id_prefix+"reducebutton");
    var unreducebutton = button("Unreduce");
    unreducebutton.classList.add("unreducebutton");
    unreducebutton.id = (draw_context.id_prefix+"unreducebutton");
    var rerenderbutton = button("Create new view");
    rerenderbutton.classList.add("rerenderbutton");
    rerenderbutton.id = (draw_context.id_prefix+"rerenderbutton");
    unreducebutton.onclick = () =>{undo_reduce(new_draw_context);}
    reducebutton.onclick =   () =>{  do_reduce_pre(new_draw_context);}
    rerenderbutton.onclick = () =>{   rerender(new_draw_context);}
    newlayerbutton.onclick = () =>{   create_new_layer(new_draw_context);}
    buttondiv.appendChild(unreducebutton);
    buttondiv.appendChild(reducebutton  );
    buttondiv.appendChild(rerenderbutton);
    buttondiv.appendChild(newlayerbutton);

    draw_context.view_elem.insertBefore(buttondiv, draw_context.view_elem.children[0]);


    var zoomdiv = document.createElement("div");
    zoomdiv.classList.add("zoom_buttons");
    var zoomin = button("+");
    zoomin.classList.add("zoominbutton");
    zoomin.id = (draw_context.id_prefix+"zoominbutton");
    var zoomout = button("-");
    zoomout.classList.add("zoomoutbutton");
    zoomout.id = (draw_context.id_prefix+"zoomoutbutton");
    zoomin.onclick = () => { zoom_in(draw_context); };
    zoomout.onclick = () => { zoom_out(draw_context); };

    zoomdiv.appendChild(zoomin);
    zoomdiv.appendChild(zoomout);

    draw_context.view_elem.appendChild(zoomdiv);
}

function onclick_select_functions(draw_context) {
  for (let n of draw_context.svg_elem.getElementsByClassName("note")) {
      n.onclick = function(ev) {toggle_selected(n,ev.shiftKey) };
  }
  for (let h of draw_context.svg_elem.getElementsByClassName("relation")) {
      h.onclick = function(ev) {toggle_selected(h,ev.shiftKey) };
  }
}


// Do all of this when we have the MEI in memory
function load_finish(e) {
  console.debug("Using globals data, parser, mei, jquery document, document, mei_graph, midi, changes, undo_cations, redo_actions, reduce_actions, rerendered_after_action, shades");

  // Parse the original document
  parser = new DOMParser();
  mei = parser.parseFromString(data,"text/xml");
  if(mei.documentElement.namespaceURI != "http://www.music-encoding.org/ns/mei") {
    // We didn't get a MEI? Try if it's a musicXML
    let new_svg = vrvToolkit.renderData(data, {pageWidth: 20000,
      pageHeight: 10000, breaks: "none"});
    if (!new_svg) {
      console.log ('Verovio could not generate SVG from non-MEI file.');
      return false;
    }
    // TODO: Detect failure and bail
    data = vrvToolkit.getMEI();
    parser = new DOMParser();
    mei = parser.parseFromString(data,"text/xml");
  }else{
    mei = fix_synonyms(mei);
  }

  mei_graph = add_or_fetch_graph();
  midi = vrvToolkit.renderToMIDI();
  orig_midi = midi;
  // Clear the old (if any)
  draw_contexts = [];
  layer_contexts = [];
  document.getElementById("layers").innerHTML="";

  // Segment existing layers
  var layers = Array.from(mei.getElementsByTagName("body")[0].getElementsByTagName("score"));
  for(let i in layers ){
    let score_elem = layers[i];
    let new_mei = mei_for_layer(mei, score_elem);
    let [new_data, new_svg] = render_mei(new_mei);
    if (!new_svg) {
      console.log ('Verovio could not generate SVG from MEI.');
      return false;
    }

    var layer_element = new_layer_element();
    var [view_element,svg_element] = new_view_elements(layer_element);
    svg_element.innerHTML = new_svg;
    var layer_context = {
      "mei"        : new_mei,
      "layer_elem" : layer_element,
      "score_elem" : score_elem,
      "id_mapping" : get_id_pairs(score_elem),
      "original_score" : i == 0 // The first layer is assumed to be the original score
    }
    layer_contexts.push(layer_context);
    var draw_context = {
		      // TODO: One draw context per existing score element
		      // already on load.
		      "mei_score" : score_elem,
		      "svg_elem" : svg_element,
		      "view_elem" : view_element,
		      "layer" : layer_context,
		      "id_prefix" : "",
		      "zoom" : 1,
		      "reductions" : []};
    if(i != 0)
      draw_context.id_prefix = draw_contexts.length;
    finalize_draw_context(draw_context);
  }

  changes = false;
  undo_actions = [];
  redo_actions = []; //TODO, maybe?
  reduce_actions = [];

  rerendered_after_action = 0;

  if(!shades)
    toggle_shades();
  document.onkeypress = function(ev) {handle_keypress(ev);};
  document.onkeydown = handle_keydown;
  document.onkeyup = handle_keyup;
  document.getElementById("layers").onclick = handle_click;
  return true;
}



function rerender_mei(replace_with_rests = false, draw_context = draw_contexts[0]) {
//  var mei = draw_context.mei;
  var svg_elem = draw_context.svg_elem;
  var mei2 = mei_for_layer(mei,draw_context.layer.score_elem);

  Array.from(mei2.getElementsByTagName("note")).forEach((n) => {
    let x = document.getElementById(id_in_svg(draw_context,get_id(n)));
    if(!x || x.classList.contains("hidden")){
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

function create_new_layer(draw_context) {
  var new_score_elem = new_layer(draw_context);
  let new_mei = mei_for_layer(mei, new_score_elem);
  var [new_data, new_svg] = render_mei(new_mei);
  if (!new_svg) {
    console.log ('Verovio could not generate SVG from MEI.');
    return false;
  }

  var layer_element = new_layer_element();
  var [new_view_elem,new_svg_elem] = new_view_elements(layer_element);
  new_svg_elem.innerHTML = new_svg;
  var layer_context = {
    "mei"        : new_mei,
    "layer_elem" : layer_element,
    "score_elem" : new_score_elem,
    "id_mapping" : get_id_pairs(new_score_elem),
    "original_score" : false
  }
  layer_contexts.push(layer_context);
  var new_draw_context = {
		    // TODO: One draw context per existing score element
		    // already on load.
		    "mei_score" : new_score_elem,
		    "svg_elem" : new_svg_elem,
		    "view_elem" : new_view_elem,
		    "layer" : layer_context,
		    "id_prefix" : "",
		    "zoom" : 1,
		    "reductions" : []};

  //prefix_draw_context(new_draw_context);
  new_draw_context.id_prefix = draw_contexts.length;
  finalize_draw_context(new_draw_context);
}


function finalize_draw_context(new_draw_context) {

  new_draw_context.measure_map = compute_measure_map(new_draw_context);
  add_buttons(new_draw_context)
  draw_contexts.reverse();
  draw_contexts.push(new_draw_context);
  draw_contexts.reverse();
  for (let n of new_draw_context.svg_elem.getElementsByClassName("note")) {
      n.onclick= function(ev) {toggle_selected(n,ev.shiftKey) };
  }
  for (let s of new_draw_context.svg_elem.getElementsByClassName("staff")) {
    //TODO: handle staves with no notes in them
      let [y_to_p,p_to_y] = pitch_grid(s);
      s.y_to_p = y_to_p;
      s.p_to_y = p_to_y;
  }
  draw_graph(new_draw_context);
}

function render_mei(mei) {
  var data = new XMLSerializer().serializeToString(mei);

  var svg = vrvToolkit.renderData(data, {pageWidth: 20000,
      pageHeight: 10000, breaks: "none"});
  return [data,svg];
}


function rerender(draw_context) {
  var [new_view_elem,new_svg_elem] = new_view_elements(draw_context.layer.layer_elem);
  var new_mei = rerender_mei(false, draw_context);
  var [new_data, new_svg] = render_mei(new_mei);
  if (!new_svg) {
    console.log ('Verovio could not generate SVG from MEI.');
    return false;
  }
  
  new_svg_elem.innerHTML = new_svg;
  var new_draw_context = {
		    // TODO: One draw context per existing score element
		    // already on load.
		    "mei_score" : draw_context.mei_score,
		    "svg_elem" : new_svg_elem,
		    "view_elem" : new_view_elem,
		    "layer" : draw_context.layer,
		    "id_prefix" : "",
		    "zoom" : 1,
		    "reductions" : []};

  new_draw_context.id_prefix = draw_contexts.length;
  prefix_ids(new_draw_context.svg_elem,new_draw_context.id_prefix);
  finalize_draw_context(new_draw_context);
}


function texton() { text_input = true; }
function textoff() { text_input = false; }
function show_buttons() {
  $("#load_save")[0].classList.remove("hidden");
  $("#hidden_buttons")[0].classList.add("hidden");
}
function hide_buttons() {
  $("#load_save")[0].classList.add("hidden");
  $("#hidden_buttons")[0].classList.remove("hidden");
}

function zoom_in(draw_context) {
  draw_context.zoom = draw_context.zoom * 1.1;
  draw_context.svg_elem.children[0].style.transform="scale("+draw_context.zoom+")";
}
function zoom_out(draw_context) {
  draw_context.zoom = draw_context.zoom * 0.90909090909090;
  draw_context.svg_elem.children[0].style.transform="scale("+draw_context.zoom+")";
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
