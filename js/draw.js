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
  elem.setAttribute("class","relation");
  elem.setAttribute("type",type);
  elem.style.fillOpacity = "0.5";
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

    primaries.forEach((item) => {
        if(item.style.filter == ""){
          item.style.transform = "translate3d(0,0,0)";
          item.style.filter = "url(\"#extraFilter\")";
          }});
    secondaries.forEach((item) => {
        if(item.style.filter == ""){
          item.style.transform = "translate3d(0,0,0)";
          item.style.filter = "url(\"#selectFilter\")";
          }});
  }
  elem.onmouseout = function (ev) {
    primaries.forEach((item) => {
        if(item.style.filter == "url(\"#extraFilter\")") {
          item.style.transform = "";
          item.style.filter = "";
        }});
    secondaries.forEach((item) => {
        if(item.style.filter == "url(\"#selectFilter\")") {
          item.style.transform = "";
          item.style.filter = "";
        }});
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
  g_elem.setAttribute("class","metarelation");
  g_elem.setAttribute("type",type);
  g_elem.style.fillOpacity = "0.5";
  g_elem.style.strokeOpacity = "0.1";
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

    targets.forEach((item) => {
        if(item.style.filter == ""){
          item.style.transform = "translate3d(0,0,0)";
          item.style.filter = "url(\"#glowFilter\")";
          }});
  }
  g_elem.onmouseout = function (ev) {
    targets.forEach((item) => {
        if(item.style.filter == "url(\"#glowFilter\")") {
          item.style.transform = "";
          item.style.filter = "";
        }});
  }
  return added;
  

}

function draw_relation_arg(draw_context, mei_graph, g_elem) {
  var added = [];
  var mei = draw_context.mei;
  var svg_elem = draw_context.svg_elem;
  var id_prefix = draw_context.id_prefix;
  var primaries = relation_primaries_arg(mei_graph,g_elem).map(
      (e) => svg_find_from_mei_elem(svg_elem, id_prefix, get_by_id(mei, note_get_sameas(e))));
  var secondaries = relation_secondaries_arg(mei_graph,g_elem).map(
      (e) => svg_find_from_mei_elem(svg_elem, id_prefix, get_by_id(mei, note_get_sameas(e))));
  var notes = primaries.concat(secondaries)
  notes.sort((a,b) => { 
      var p1= note_coords(a);
      var p2= note_coords(b);
      return (p1[0] - p2[0]) ? (p1[0] - p2[0]) : (p1[1] - p2[1]);
    });
  var id = id_prefix + g_elem.getAttribute("xml:id");
  var type = relation_type(g_elem);

  var elem = roundedHull(notes.map(note_coords));
  elem.setAttribute("id",id);
  elem.setAttribute("class","relation");
  elem.setAttribute("type",type);
  elem.style.fillOpacity = "0.5";
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
  add_to_svg_bg_arg(svg_elem,elem);
  added.push(elem);
  elem.onclick = function(ev) {toggle_selected(elem,ev.shiftKey);};
  elem.onmouseover = function (ev) {

    primaries.forEach((item) => {
        if(item.style.filter == ""){
          item.style.transform = "translate3d(0,0,0)";
          item.style.filter = "url(\"#extraFilter\")";
          }});
    secondaries.forEach((item) => {
        if(item.style.filter == ""){
          item.style.transform = "translate3d(0,0,0)";
          item.style.filter = "url(\"#selectFilter\")";
          }});
  }
  elem.onmouseout = function (ev) {
    primaries.forEach((item) => {
        if(item.style.filter == "url(\"#extraFilter\")") {
          item.style.transform = "";
          item.style.filter = "";
        }});
    secondaries.forEach((item) => {
        if(item.style.filter == "url(\"#selectFilter\")") {
          item.style.transform = "";
          item.style.filter = "";
        }});
  }
  //TODO: Set up more onhover stuff for The Same Relation
  //Elsewhere - but perhaps that's a separate thing?

  return added;

}

function draw_metarelation_arg(draw_context, mei_graph, g_elem) {
  var added = [];
  var mei = draw_context.mei;
  var svg_elem = draw_context.svg_elem;
  var id_prefix = draw_context.id_prefix;
  var id = id_prefix + g_elem.getAttribute("xml:id");
  var type = relation_type(g_elem);
  var targets = relation_allnodes_arg(mei_graph, g_elem).map(
      (e) => svg_find_from_mei_elem(svg_elem, id_prefix, e));
  var coords = targets.map(get_metarelation_target);
  var x = average(coords.map((e) => e[0]));
  // Above
  var y = targets.concat([svg_elem.getElementsByClassName("system")[0]]).map((b) => b.getBBox().y).sort((a,b) => a > b)[0] - 500;

  coords.push([x,y]);
  var elem = g_arg(svg_elem);
  var elem = roundedHull(coords);
  elem.setAttribute("id",id);
  elem.setAttribute("class","metarelation");
  elem.setAttribute("type",type);
  elem.style.fillOpacity = "0.5";
  elem.style.strokeOpacity = "0.1";
  elem.onwheel = (e) => {
    var elem1 = e.target;
    var paren = elem1.parentElement;
    paren.removeChild(elem1);
    paren.insertBefore(elem1,paren.children[0]);
    return false;
  };
  coords.forEach((crds) => { var line_elem = line([x,y],crds);
      elem.appendChild(line_elem);});
  elem.appendChild(circle([x,y],200));
  if(shades)
    toggle_shade(elem);
  add_to_svg_bg_arg(svg_elem,elem);
  added.push(elem);
  elem.onclick = function(ev) {toggle_selected(elem,ev.shiftKey);};
  elem.onmouseover = function (ev) {

    targets.forEach((item) => {
        if(item.style.filter == ""){
          item.style.transform = "translate3d(0,0,0)";
          item.style.filter = "url(\"#glowFilter\")";
          }});
  }
  elem.onmouseout = function (ev) {
    targets.forEach((item) => {
        if(item.style.filter == "url(\"#glowFilter\")") {
          item.style.transform = "";
          item.style.filter = "";
        }});
  }
  return added;
}
