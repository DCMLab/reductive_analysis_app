/* UI globals */

var non_notes_hidden = false;

var text_input=false;

var shades = false;

// Hovering and adding notes
var placing_note="";

var current_draw_context;

var mouseX;
var mouseY;

/* Select stuff */

// Clicking selects
var selected = [];
// Shift-clicking extra selects
var extraselected = [];

// Toggle if a thing (for now: note or relation) is selected or not.
function toggle_selected(item,extra) { 
  console.debug("Using globals: selected, extraselected for adding/removing selected items. JQuery for changing displayed text of selected items");
  var ci = get_class_from_classlist(item);
  var cd = item.closest("div");
  if(selected.length > 0 || extraselected.length > 0) {
    var csel = get_class_from_classlist(selected.concat(extraselected)[0]);
    var cdsel = selected.concat(extraselected)[0].closest("div");
    // Select only things of the same type for now - editing
    // relations to add things means deleting and re-adding
    if(ci != csel)
      return;
    if(cd != cdsel)
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

/* UI populater functions */ 

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
function combo_type(type) {
  var elem = document.createElement("input");
  elem.setAttribute("type","button");
  elem.classList.add("comborelationbutton");
  elem.setAttribute("id",type + "comborelationbutton");
  elem.setAttribute("value","Add "+combo_conf[type].total+" comborelation " + "(" + combo_conf[type].key + ")");
  elem.onclick = () => {do_comborelation(type);};
  $("#combo_buttons")[0].appendChild(elem);
  combo_keys[combo_conf[type].key] = type;
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

function add_buttons(draw_context) {
  add_filters(draw_context);
  var new_draw_context = draw_context;
  var buttondiv = document.createElement("div");
  buttondiv.classList.add("view_buttons");
  var newlayerbutton = button("Create new layer");
  newlayerbutton.classList.add("newlayerbutton");
  newlayerbutton.id = (draw_context.id_prefix+"newlayerbutton");
  var slicecheck = checkbox("Sliced");
  slicecheck.id = (draw_context.id_prefix+"slicedcb");
  slicecheck.checked = false;
  var reducebutton = button("Reduce");
  reducebutton.classList.add("reducebutton");
  reducebutton.id = (draw_context.id_prefix+"reducebutton");
  var unreducebutton = button("Unreduce");
  unreducebutton.classList.add("unreducebutton");
  unreducebutton.id = (draw_context.id_prefix+"unreducebutton");
  var rerenderbutton = button("Create new view");
  rerenderbutton.classList.add("rerenderbutton");
  rerenderbutton.id = (draw_context.id_prefix+"rerenderbutton");
  var playbutton = button("Play reduction");
  playbutton.classList.add("midireducebutton");
  playbutton.id = (draw_context.id_prefix+"midireducebutton");
  var hierbutton = button("Show/update hierarchy");
  hierbutton.classList.add("hierarchybutton");
  hierbutton.id = (draw_context.id_prefix+"hierarchybutton");
  var hidehierbutton = button("Hide hierarchy");
  hidehierbutton.classList.add("hidehierarchybutton");
  hidehierbutton.id = (draw_context.id_prefix+"hidehierarchybutton");
  var hiercheck = checkbox("Roots low");
  hiercheck.id = (draw_context.id_prefix+"hierarchycb");
  hiercheck.checked = true;
  unreducebutton.onclick = () =>{undo_reduce(new_draw_context);}
  reducebutton.onclick =   () =>{  do_reduce_pre(new_draw_context);}
  rerenderbutton.onclick = () =>{   rerender(new_draw_context);}
  newlayerbutton.onclick = () =>{ create_new_layer(new_draw_context,slicecheck.checked);}
  playbutton.onclick =     () =>{play_midi_reduction(new_draw_context);}
  hierbutton.onclick =     () =>{draw_hierarchy_graph(new_draw_context,50,hiercheck.checked);}
  hidehierbutton.onclick = () =>{hide_hierarchy_graph(new_draw_context);}

  buttondiv.appendChild(document.createTextNode("\u25BC"));
  buttondiv.appendChild(document.createElement("br"));
  buttondiv.appendChild(document.createElement("br"));

  buttondiv.appendChild(unreducebutton);
  buttondiv.appendChild(document.createElement("br"));

  buttondiv.appendChild(reducebutton  );
  buttondiv.appendChild(document.createElement("br"));

  buttondiv.appendChild(rerenderbutton);
  buttondiv.appendChild(document.createElement("br"));

  buttondiv.appendChild(newlayerbutton);
  buttondiv.appendChild(document.createElement("br"));
  buttondiv.appendChild(slicecheck);
  var slice_label = document.createElement("label")
  slice_label.htmlFor = draw_context.id_prefix+"slicedcb";
  slice_label.appendChild(document.createTextNode("Sliced"));
  buttondiv.append(slice_label);
  buttondiv.appendChild(document.createElement("br"));
  buttondiv.appendChild(document.createElement("br"));

  buttondiv.appendChild(playbutton);
  buttondiv.appendChild(document.createElement("br"));
  buttondiv.appendChild(document.createElement("br"));

  buttondiv.appendChild(hierbutton);
  buttondiv.appendChild(document.createElement("br"));
  buttondiv.appendChild(hidehierbutton);
  buttondiv.appendChild(document.createElement("br"));
  buttondiv.appendChild(hiercheck); 
  var roots_low_label = document.createElement("label")
  roots_low_label.htmlFor = draw_context.id_prefix+"hierarchycb";
  roots_low_label.appendChild(document.createTextNode("Draw roots low"));
  buttondiv.append(roots_low_label);
  buttondiv.appendChild(document.createElement("br"));
  buttondiv.appendChild(document.createElement("br"));

  // Tree stuff
  var treetext = document.createElement("textarea");
  treetext.id = draw_context.id_prefix +"treeinput";
  treetext.width="100px";
  var treebutton = button("Align JSON tree: ");
  treebutton.id = draw_context.id_prefix+"treebutton";
  treebutton.onclick = () =>{draw_tree(new_draw_context);};
  treetext.onfocus=texton;
  treetext.onblur=textoff;
  buttondiv.appendChild(treebutton);
  buttondiv.appendChild(document.createElement("br"));
  buttondiv.appendChild(treetext); buttondiv.appendChild(document.createElement("br"));


  draw_context.view_elem.children[0].appendChild(buttondiv);
}

function add_filter(draw_context, div, type, thing) {
  var d = document.createElement("div");
  var cb = checkbox(type);
  cb.id = draw_context.id_prefix + type + "filtercb";
  cb.classList.add(type+"filtercb");
  cb.checked = true;
  d.appendChild(cb);
  div.appendChild(d);
  var label = document. createElement("Label");
  label.setAttribute("for", cb.id);
  label.style.color = type_shades[type];
  label.innerHTML = type;
  d.appendChild(label);
  cb.onclick = (ev) => {
    var filtered = !cb.checked;
    Array.from(draw_context.svg_elem.getElementsByClassName(thing)).forEach((e) => {
      if(e.getAttribute("type") == type){
        if(filtered)
	  e.classList.add("filtered");
	else
	  e.classList.remove("filtered");
      }
    });
  };
}

function add_filters(draw_context) {
  var sidebar = document.createElement("div");
  sidebar.id = draw_context.id_prefix + "sidebardiv";
  sidebar.classList.add("sidebar");
  draw_context.view_elem.prepend(sidebar);

  var div = document.createElement("div");
  div.id = draw_context.id_prefix + "filterdiv";
  div.classList.add("filterdiv");
  div.innerHTML = "&#9776;<br/></br>"
  sidebar.prepend(div);

  Object.keys(type_conf).forEach((x) => add_filter(draw_context, div, x, "relation"));
  Object.keys(meta_conf).forEach((x) => add_filter(draw_context, div, x, "metarelation"));

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

  div.appendChild(zoomdiv);
}




function onclick_select_functions(draw_context) {
  for (let n of draw_context.svg_elem.getElementsByClassName("note")) {
    n.onclick = function(ev) {toggle_selected(n,ev.shiftKey) };
  }
  for (let h of draw_context.svg_elem.getElementsByClassName("relation")) {
    h.onclick = function(ev) {toggle_selected(h,ev.shiftKey) };
  }
}

/* Keypress/mouse handler functions */

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
  } else if (ev.key == "U") { // UNDO
    do_undo();
  } else if (ev.key == "r") { // Reduce relations
    do_reduce_pre(current_draw_context);
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
  } else if (combo_keys[ev.key]) { // Add a relation
    do_comborelation(combo_keys[ev.key]);
  }else {
    console.log(ev);
  }
}


/* Large-ish UI functions*/

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
  Array.from(document.getElementsByClassName("beam")).forEach((x) => {
    Array.from(x.children).forEach((x) => { 
      if(x.tagName == "polygon") { 
        hidden ? x.classList.add("hidden") : x.classList.remove("hidden"); 
      }
    })
  });
  hide_classes.forEach((cl) => {
    Array.from(document.getElementsByClassName(cl)).forEach((x) => { 
      hidden ? x.classList.add("hidden") : x.classList.remove("hidden");
    })
  });
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


/* Small UI functions */ 

function texton() { text_input = true; }
function textoff() { text_input = false; }
function show_buttons() {
  $("#load_save")[0].classList.remove("hidden");
  $("#hidden_buttons")[0].classList.add("hidden");
}

function toggle_buttons() {
  if (!$("#relations_panel").hasClass('collapsed')) {
    $("#relations_panel").addClass('collapsed')
    $("#relations_panel input").addClass('none');
  } else {
    $("#relations_panel").removeClass('collapsed')
    $("#relations_panel input").removeClass('none');
  }
}

function zoom_in(draw_context) {
  draw_context.zoom = draw_context.zoom * 1.1;
  draw_context.svg_elem.style.transform="scale("+draw_context.zoom+")";
}
function zoom_out(draw_context) {
  draw_context.zoom = draw_context.zoom * 0.90909090909090;
  draw_context.svg_elem.style.transform="scale("+draw_context.zoom+")";
}


function do_deselect() {
  selected.forEach((x) => toggle_selected(x));
  extraselected.forEach((x) => toggle_selected(x,true));
}

function play_midi() {
  $("#player").midiPlayer.play("data:audio/midi;base64,"+orig_midi);
}

function play_midi_reduction(draw_context=draw_contexts[0]) {
  var mei2 = rerender_mei(true, draw_context);
  var data2 = new XMLSerializer().serializeToString(mei2);
  vrvToolkit.loadData(data2);
  $("#player").midiPlayer.play("data:audio/midi;base64,"+vrvToolkit.renderToMIDI());
  vrvToolkit.loadData(data);

}

function handle_hull_controller() {
  do_deselect();
  $(".relation").remove();
  $(".metarelation").remove(); 
  var nodes_array = Array.from(mei_graph.getElementsByTagName("node"));
  var relations_nodes = nodes_array.filter((x) => { return x.getAttribute("type") == "relation";})
  var metarelations_nodes = nodes_array.filter((x) => { return x.getAttribute("type") == "metarelation";})
  draw_contexts.forEach(draw_context => {
    relations_nodes.forEach((g_elem) => {
      unmark_secondaries(draw_context,mei_graph,g_elem);
    })
  });
  draw_contexts.hullPadding = $("#hull_controller").val();
  draw_contexts.forEach(context => draw_graph(context));
}


function handle_relations_panel(el) {
  var newX = 0, newY = 0, curX = 0, curY = 0;
  if (document.getElementById(el.id + "_header")) {
    document.getElementById(el.id + "_header").onmousedown = startDragging;
  } else {
    elmnt.onmousedown = startDragging;
  }

  function startDragging(e) {
    e = e || window.event;
    e.preventDefault();
    curX = e.clientX;
    curY = e.clientY;
    document.onmouseup = stopDragging;
    document.onmousemove = drag;
  }

  function drag(e) {
    e = e || window.event;
    e.preventDefault();
    // Calculate the new cursor position:
    newX = curX - e.clientX;
    newY = curY - e.clientY;
    curX = e.clientX;
    curY = e.clientY;
    // Set the element's new position:
    if (curX >= 0 && curY >= 0) {
      el.style.top = (el.offsetTop - newY) + "px";
      el.style.left = (el.offsetLeft - newX) + "px";
    } 
  }

  function stopDragging() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
