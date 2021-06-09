// GLOBALS
// Load Verovio
var vrvToolkit = new verovio.toolkit();
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

// Each layer context contains information relevant to the layer, such as
//  * The rendered MEI
//  * The score element in the original MEI
//  * The <div> element containing the layer
//  * A mapping from each element in the layer score element to its
//  canonical representative
var layer_contexts = [];

// Prevent unsaved data loss by warning user before browser unload events (reload, close).
// Attempting to do this in compliant fashion (https://html.spec.whatwg.org/#prompt-to-unload-a-document).
window.addEventListener("beforeunload", function (e) {
  var confirmationMessage = "Leave app? You may lose unsaved changes.";

  e.preventDefault();
  e.returnValue = confirmationMessage;
  return confirmationMessage;   // Some browsers don't follow the standard and require this.
});

// Once things are loaded, do configuration stuff
$(document).ready(function() {
  Object.keys(type_conf).forEach(init_type);
  Object.keys(meta_conf).forEach(meta_type);
  Object.keys(combo_conf).forEach(combo_type);
  toggle_shades();
  $("#player").midiPlayer({ color: "grey", width: 250 });
  $("#selected_things").hide();

  $("#hull_controller").on('change', handle_hull_controller);
  handle_relations_panel(document.getElementById("relations_panel"));
});


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
      let g_elem =draw_relation(draw_contexts[i],mei_graph,get_by_id(mei_graph.getRootNode(), he_id));
      if(g_elem){
	added.push(g_elem); // Draw the edge
	mark_secondaries(draw_contexts[i],mei_graph,get_by_id(mei_graph.getRootNode(),he_id));
      }
    }
    undo_actions.push(["relation",added.reverse(),selected,extraselected]);
    selected.concat(extraselected).forEach(toggle_selected); // De-select
  }
}

function do_comborelation(type) {
  var all = selected.concat(extraselected);
  if (all.length < 3 || extraselected.length > 2) { return;} 
  all.sort((a,b) => {
    var [ax,ay] = note_coords(a);
    var [bx,by] = note_coords(b);
    return ax - bx;
  });
  var fst = all.shift();
  var snd = all.pop();
  selected = selected.filter((e) => e == fst || e == snd);
  do_relation(combo_conf[type].outer);
  
  extraselected = [fst,snd];
  selected = all;
  do_relation(combo_conf[type].total);

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
    });
    metarelations_nodes.forEach((g_elem) => draw_metarelation(draw_context,mei_graph,g_elem));
}




// Do all of this when we have the MEI in memory
function load_finish(e) {
  console.debug("Using globals data, parser, mei, jquery document, document, mei_graph, midi, changes, undo_cations, redo_actions, reduce_actions, rerendered_after_action, shades");

  // Parse the original document
  parser = new DOMParser();
  mei = parser.parseFromString(data,"text/xml");
  vrvToolkit = new verovio.toolkit();
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
  initialize_metadata();
  // Clear the old (if any)
  draw_contexts = [];
  layer_contexts = [];
  document.getElementById("layers").innerHTML="";

  $("#hull_controller").val(200);
  draw_contexts.hullPadding = $("#hull_controller").val();

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
    if(i == 0){
      midi = vrvToolkit.renderToMIDI();
      orig_midi = midi;
    }else
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

  // Install drag-select controller.
  drag_selector_installer();

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
  Array.from(mei2.getElementsByTagName("chord")).forEach((x) => {
    var paren = x.parentNode;
    if(x.getElementsByTagName("note").length == 0){
      x.parentNode.removeChild(x);
    }
  });

  return mei2;

}

function drag_selector_installer(svg_elem) {
  // See https://github.com/ThibaultJanBeyer/DragSelect for API documentation.

  window.drag_selector = new DragSelect({
    selectables: document.getElementsByClassName('relation'),
    area: document,
    draggability: false,
    overflowTolerance: {x: 1, y: 1}
  });

  drag_selector.subscribe('elementselect', ({items, item}) => {
    if(!selected.find(x => x === item) && !extraselected.find(x => x === item)) { 
      toggle_selected(item);
    }
  });

  drag_selector.subscribe('dragstart', ({items, event, isDragging}) => {
    $('.ds-selector-area').show();
  })

  drag_selector.subscribe('dragmove', ({items, event, isDragging}) => {
    if ($('.ds-selector').height() > 10 || $('.ds-selector').width() > 10) {
      $('#load_save, #metadata_input, #relations_panel, .sidebar').fadeOut(300);
      document.body.style.cursor = 'url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMjJwdCIgaGVpZ2h0PSIyMnB0IiB2aWV3Qm94PSIwIDAgMjIgMjIiIHZlcnNpb249IjEuMSI+CjxnIGlkPSJzdXJmYWNlMSI+CjxwYXRoIHN0eWxlPSIgc3Ryb2tlOm5vbmU7ZmlsbC1ydWxlOm5vbnplcm87ZmlsbDpyZ2IoMCUsMCUsMCUpO2ZpbGwtb3BhY2l0eToxOyIgZD0iTSA0LjQ0OTIxOSAxNC44MDA3ODEgQyA0LjI2OTUzMSAxNC42MjEwOTQgMy45ODA0NjkgMTQuNjIxMDk0IDMuODAwNzgxIDE0LjgwMDc4MSBDIDMuNjIxMDk0IDE0Ljk4MDQ2OSAzLjYyMTA5NCAxNS4yNjk1MzEgMy44MDA3ODEgMTUuNDQ5MjE5IEMgNS43Njk1MzEgMTcuNDE3OTY5IDUuNzY5NTMxIDE5LjI1IDMuODAwNzgxIDIxLjIxODc1IEMgMy42MjEwOTQgMjEuMzk4NDM4IDMuNjIxMDk0IDIxLjY4NzUgMy44MDA3ODEgMjEuODY3MTg4IEMgMy44OTA2MjUgMjEuOTU3MDMxIDQuMDA3ODEyIDIyIDQuMTI1IDIyIEMgNC4yNDIxODggMjIgNC4zNTkzNzUgMjEuOTU3MDMxIDQuNDQ5MjE5IDIxLjg2NzE4OCBDIDYuNzU3ODEyIDE5LjU1NDY4OCA2Ljc1NzgxMiAxNy4xMTMyODEgNC40NDkyMTkgMTQuODAwNzgxIFogTSA0LjQ0OTIxOSAxNC44MDA3ODEgIi8+CjxwYXRoIHN0eWxlPSIgc3Ryb2tlOm5vbmU7ZmlsbC1ydWxlOm5vbnplcm87ZmlsbDpyZ2IoMCUsMCUsMCUpO2ZpbGwtb3BhY2l0eToxOyIgZD0iTSA0LjEyNSAxMS45MTc5NjkgQyAzLjExMzI4MSAxMS45MTc5NjkgMi4yOTI5NjkgMTIuNzM4MjgxIDIuMjkyOTY5IDEzLjc1IEMgMi4yOTI5NjkgMTQuNzYxNzE5IDMuMTEzMjgxIDE1LjU4MjAzMSA0LjEyNSAxNS41ODIwMzEgQyA1LjEzNjcxOSAxNS41ODIwMzEgNS45NTcwMzEgMTQuNzYxNzE5IDUuOTU3MDMxIDEzLjc1IEMgNS45NTcwMzEgMTIuNzM4MjgxIDUuMTM2NzE5IDExLjkxNzk2OSA0LjEyNSAxMS45MTc5NjkgWiBNIDQuMTI1IDE0LjY2Nzk2OSBDIDMuNjIxMDk0IDE0LjY2Nzk2OSAzLjIwNzAzMSAxNC4yNTM5MDYgMy4yMDcwMzEgMTMuNzUgQyAzLjIwNzAzMSAxMy4yNDYwOTQgMy42MjEwOTQgMTIuODMyMDMxIDQuMTI1IDEyLjgzMjAzMSBDIDQuNjI4OTA2IDEyLjgzMjAzMSA1LjA0Mjk2OSAxMy4yNDYwOTQgNS4wNDI5NjkgMTMuNzUgQyA1LjA0Mjk2OSAxNC4yNTM5MDYgNC42Mjg5MDYgMTQuNjY3OTY5IDQuMTI1IDE0LjY2Nzk2OSBaIE0gNC4xMjUgMTQuNjY3OTY5ICIvPgo8cGF0aCBzdHlsZT0iIHN0cm9rZTpub25lO2ZpbGwtcnVsZTpub256ZXJvO2ZpbGw6cmdiKDAlLDAlLDAlKTtmaWxsLW9wYWNpdHk6MTsiIGQ9Ik0gMjEuNzY1NjI1IDEzLjgwODU5NCBMIDEzLjUxNTYyNSA5LjIyMjY1NiBDIDEzLjM0Mzc1IDkuMTI4OTA2IDEzLjEzNjcxOSA5LjE1MjM0NCAxMi45ODgyODEgOS4yODEyNSBDIDEyLjg0Mzc1IDkuNDEwMTU2IDEyLjc5Mjk2OSA5LjYxMzI4MSAxMi44NjcxODggOS43OTY4NzUgTCAxNi41MzEyNSAxOC45NjA5MzggQyAxNi42MDE1NjIgMTkuMTMyODEyIDE2Ljc2OTUzMSAxOS4yNSAxNi45NTMxMjUgMTkuMjUgQyAxNi45NTMxMjUgMTkuMjUgMTYuOTU3MDMxIDE5LjI1IDE2Ljk1NzAzMSAxOS4yNSBDIDE3LjE0MDYyNSAxOS4yNSAxNy4zMDg1OTQgMTkuMTQwNjI1IDE3LjM3ODkwNiAxOC45NzI2NTYgTCAxOC42ODM1OTQgMTUuOTMzNTk0IEwgMjEuNzIyNjU2IDE0LjYyODkwNiBDIDIxLjg4MjgxMiAxNC41NjI1IDIxLjk4ODI4MSAxNC40MDYyNSAyMiAxNC4yMzA0NjkgQyAyMi4wMDc4MTIgMTQuMDU4NTk0IDIxLjkxNzk2OSAxMy44OTQ1MzEgMjEuNzY1NjI1IDEzLjgwODU5NCBaIE0gMjEuNzY1NjI1IDEzLjgwODU5NCAiLz4KPHBhdGggc3R5bGU9IiBzdHJva2U6bm9uZTtmaWxsLXJ1bGU6bm9uemVybztmaWxsOnJnYigwJSwwJSwwJSk7ZmlsbC1vcGFjaXR5OjE7IiBkPSJNIDUuNjY0MDYyIDEyLjc2NTYyNSBDIDUuNTc4MTI1IDEyLjYyODkwNiA1LjQ3MjY1NiAxMi41MDc4MTIgNS4zNTU0NjkgMTIuNDAyMzQ0IEMgNS4zMzk4NDQgMTIuMzg2NzE5IDUuMzI0MjE5IDEyLjM3NSA1LjMwODU5NCAxMi4zNjMyODEgQyA1LjIxMDkzOCAxMi4yNzczNDQgNS4xMDU0NjkgMTIuMjA3MDMxIDQuOTkyMTg4IDEyLjE0NDUzMSBDIDQuOTYwOTM4IDEyLjEyODkwNiA0LjkyOTY4OCAxMi4xMDkzNzUgNC44OTg0MzggMTIuMDkzNzUgQyA0Ljc3MzQzOCAxMi4wMzUxNTYgNC42NDQ1MzEgMTEuOTg4MjgxIDQuNTA3ODEyIDExLjk1NzAzMSBDIDQuNDY4NzUgMTEuOTQ5MjE5IDQuNDI1NzgxIDExLjk0OTIxOSA0LjM4MjgxMiAxMS45NDE0MDYgQyA0LjI2OTUzMSAxMS45MjU3ODEgNC4xNTIzNDQgMTEuOTE3OTY5IDQuMDM5MDYyIDExLjkyNTc4MSBDIDMuNjMyODEyIDExLjk0NTMxMiAzLjI2NTYyNSAxMi4wOTc2NTYgMi45Njg3NSAxMi4zMzU5MzggQyAzLjE5MTQwNiAxMi40OTYwOTQgMy40MTQwNjIgMTIuNjQ4NDM4IDMuNjU2MjUgMTIuNzkyOTY5IEMgMy43NSAxMi44NDc2NTYgMy44NTkzNzUgMTIuODY3MTg4IDMuOTY4NzUgMTIuODUxNTYyIEMgNC4zNDc2NTYgMTIuNzg1MTU2IDQuNzUzOTA2IDEyLjk3NjU2MiA0LjkzNzUgMTMuMzM1OTM4IEMgNC45ODgyODEgMTMuNDMzNTk0IDUuMDcwMzEyIDEzLjUxMTcxOSA1LjE2Nzk2OSAxMy41NTA3ODEgQyA1LjQyMTg3NSAxMy42NTYyNSA1LjY4NzUgMTMuNzM4MjgxIDUuOTQ5MjE5IDEzLjgyODEyNSBDIDUuOTQ5MjE5IDEzLjgwMDc4MSA1Ljk1NzAzMSAxMy43NzczNDQgNS45NTcwMzEgMTMuNzUgQyA1Ljk1NzAzMSAxMy4zODY3MTkgNS44NDc2NTYgMTMuMDUwNzgxIDUuNjY0MDYyIDEyLjc2NTYyNSBaIE0gNS42NjQwNjIgMTIuNzY1NjI1ICIvPgo8cGF0aCBzdHlsZT0iIHN0cm9rZTpub25lO2ZpbGwtcnVsZTpub256ZXJvO2ZpbGw6cmdiKDAlLDAlLDAlKTtmaWxsLW9wYWNpdHk6MTsiIGQ9Ik0gMTMuMzgyODEyIDEzLjU1ODU5NCBDIDExLjE5MTQwNiAxMy44OTg0MzggOC44NTkzNzUgMTMuNzUgNi44MDQ2ODggMTMuMTUyMzQ0IEMgNi44NDc2NTYgMTMuMzQzNzUgNi44NzUgMTMuNTQyOTY5IDYuODc1IDEzLjc1IEMgNi44NzUgMTMuODcxMDk0IDYuODU1NDY5IDEzLjk4ODI4MSA2LjgzOTg0NCAxNC4xMDkzNzUgQyA4LjE1NjI1IDE0LjQ2ODc1IDkuNTY2NDA2IDE0LjY2Nzk2OSAxMSAxNC42Njc5NjkgQyAxMS45MjU3ODEgMTQuNjY3OTY5IDEyLjgzOTg0NCAxNC41ODIwMzEgMTMuNzM0Mzc1IDE0LjQyOTY4OCBaIE0gMTMuMzgyODEyIDEzLjU1ODU5NCAiLz4KPHBhdGggc3R5bGU9IiBzdHJva2U6bm9uZTtmaWxsLXJ1bGU6bm9uemVybztmaWxsOnJnYigwJSwwJSwwJSk7ZmlsbC1vcGFjaXR5OjE7IiBkPSJNIDExIDAgQyA0LjkzMzU5NCAwIDAgMy4yODkwNjIgMCA3LjMzMjAzMSBDIDAgOC45NDE0MDYgMC44MDQ2ODggMTAuNDkyMTg4IDIuMjM4MjgxIDExLjc1NzgxMiBDIDIuNDY4NzUgMTEuNTM5MDYyIDIuNzM4MjgxIDExLjM1NTQ2OSAzLjAzNTE1NiAxMS4yMjY1NjIgQyAxLjY3OTY4OCAxMC4xMDkzNzUgMC45MTc5NjkgOC43MzgyODEgMC45MTc5NjkgNy4zMzIwMzEgQyAwLjkxNzk2OSAzLjc5Njg3NSA1LjQ0MTQwNiAwLjkxNzk2OSAxMSAwLjkxNzk2OSBDIDE2LjU1ODU5NCAwLjkxNzk2OSAyMS4wODIwMzEgMy43OTY4NzUgMjEuMDgyMDMxIDcuMzMyMDMxIEMgMjEuMDgyMDMxIDguNzUzOTA2IDIwLjM0Mzc1IDEwLjEwMTU2MiAxOC45ODgyODEgMTEuMjE4NzUgTCAxOS44Mzk4NDQgMTEuNjg3NSBDIDIxLjIyNjU2MiAxMC40Mzc1IDIyIDguOTEwMTU2IDIyIDcuMzMyMDMxIEMgMjIgMy4yODkwNjIgMTcuMDY2NDA2IDAgMTEgMCBaIE0gMTEgMCAiLz4KPC9nPgo8L3N2Zz4K), auto';
    }
    // Due to apparent bug in the external drag-select library, some SVG elements must be made selectable manually.
    document.elementsFromPoint(mouseX, mouseY)
      .filter(x => x.classList.contains('relation'))
      .forEach(x => drag_selector.addSelectables(x));
  })

  drag_selector.subscribe('callback', ({items, event, isDragging}) => {
    document.body.style.cursor = 'default';
    $('.ds-selector-area').hide();
    $('#load_save, #metadata_input, #relations_panel, .sidebar').fadeIn(300);
  })
}

function create_new_layer(draw_context,sliced =false, tied=false) {
  var new_score_elem;
  if(sliced)
    new_score_elem = new_sliced_layer(draw_context, tied);
  else
    new_score_elem = new_layer(draw_context);
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

  var svg = vrvToolkit.renderData(data, {
                  pageWidth: 20000,
                  pageHeight: 10000, 
                  breaks: "none"
  });
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



console.log("Main webapp library is loaded");
