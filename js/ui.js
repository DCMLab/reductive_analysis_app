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
  var playbutton = button("Play reduction");
  playbutton.classList.add("midireducebutton");
  playbutton.id = (draw_context.id_prefix+"midireducebutton");
  unreducebutton.onclick = () =>{undo_reduce(new_draw_context);}
  reducebutton.onclick =   () =>{  do_reduce_pre(new_draw_context);}
  rerenderbutton.onclick = () =>{   rerender(new_draw_context);}
  newlayerbutton.onclick = () =>{   create_new_layer(new_draw_context);}
  playbutton.onclick =     () =>{play_midi_reduction(new_draw_context);}
  buttondiv.appendChild(unreducebutton);
  buttondiv.appendChild(reducebutton  );
  buttondiv.appendChild(rerenderbutton);
  buttondiv.appendChild(newlayerbutton);
  buttondiv.appendChild(playbutton);

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



