


// Returns a list of list of IDs
function calc_hierarchy(notes, relations, roots_low=true) {
  var ret = [];
  var rels = relations;
  var ns = notes.filter((x) => x != undefined);
  do{
    let ret_notes = [];
    if(roots_low)
      ret_notes = ns.filter((n) => !(rels.find((r) => relation_allnodes(mei_graph,r).includes(n))));
    var [removed_relations, removed_notes] = calc_reduce(mei_graph, 
							 rels, 
							 rels);
    ret_notes = ret_notes.concat(removed_notes.filter((n) => ns.includes(n)));
    ret.push(ret_notes);
    ns = ns.filter((x) => !ret_notes.includes(x))
    rels = rels.filter((x) => !removed_relations.includes(x))
  }while(removed_notes.length + removed_relations.length  > 0)
  ret.push(ns);
  return ret;
}

function draw_hierarchy_graph(draw_context, hullPadding=200, roots_low=true) {
  var svg_elem = draw_context.svg_elem;
  var id_prefix = draw_context.id_prefix;
  var g_elem = svg_elem.getRootNode().getElementById("hier"+id_prefix);
  var existing = g_elem ? true : false;
  if(!g_elem)
    g_elem = g(svg_elem);
  else
    g_elem.innerHTML = "";
  // find layers
  var current_note_nodes = Array.from(svg_elem.
					getElementsByClassName("note")).
					map(get_id).
					map((id) => get_by_id(mei,"gn-"+id)).
					filter((x) => x != undefined);
  var current_relation_nodes = Array.from(svg_elem.
                                            getElementsByClassName("relation")).
					    map(get_id).
					    map((id) => get_by_id(mei,id));
  var layers = calc_hierarchy(current_note_nodes,current_relation_nodes, roots_low);
  
  var svg_height = svg_elem.children[0].getAttribute("height");
  var svg_viewbox = svg_elem.getElementsByClassName("definition-scale")[0].getAttribute("viewBox");
  // find top of system
  var svg_top = 0;
  var layer_dist = 500;

  // find coordinates
  var layers_coords = layers.flatMap((layer,ix) => layer.map((e) => {
	let n = document.getElementById(id_in_svg(draw_context,node_to_note_id(e)))
	let [x,y] = note_coords(n);
	return [e, [x,svg_top - layer_dist*ix]]
      }));

  // draw nodes
  layers_coords.forEach(([e,p]) => {
      let r = hullPadding < 100 ? 50 : hullPadding/2;
      let circ = circle(p,r);
      let note_g = g(svg_elem);
      let note_id = node_to_note_id(e);
      note_g.id = "hier"+id_prefix+note_id;
      // TODO: Make work
      let txt = text(note_to_text(note_id),[p[0]+r+10,p[1]+r+10]);
      txt.style.fontFamiy = "sans-serif";
      txt.style.fontSize = (r < 100 ? 200 : (r > 200 ? 400 : r*2))+"px";

      note_g.appendChild(circ);
      note_g.appendChild(txt);
      g_elem.appendChild(note_g);

  });


  // draw hierarchy
  current_relation_nodes.forEach((r) => {
    // ID, type, and original SVG elem
    let id = id_prefix + r.getAttribute("xml:id");
    let type = relation_type(r);
    let elem_in_score = document.getElementById(id);

    let nodes = relation_allnodes(mei_graph,r);
    let node_coords = nodes.map((n) => layers_coords.find((x) => x[0] == n)[1]);

    let elem = roundedHull(node_coords, hullPadding);
    elem.setAttribute("id","hier"+id);
    if(id_prefix != "")
      elem.setAttribute("oldid",g_elem.getAttribute("xml:id"));
    elem.classList.add("relation");

    elem.setAttribute("type",type);

    // Are we running with type-specific shades?
    if(shades)
      toggle_shade(elem);
    elem.onclick = function(ev) {toggle_selected(elem_in_score,ev.shiftKey);};

    elem.onmouseover = function (ev) {
      elem_in_score.classList.add("relationhover");
      elem_in_score.onmouseover();
    }
    elem.onmouseout = function (ev) {
      elem_in_score.classList.remove("relationhover");
      elem_in_score.onmouseout();
    }

    // Relations can be scrolled
    elem.onwheel = (ev) => {
      var elem1 = ev.target;
      flip_to_bg(elem1);
      elem.onmouseout();
      return false;
    };

    // Add it to the SVG
    g_elem.appendChild(elem);

  });
  g_elem.id="hier"+id_prefix;
  add_to_svg_bg(svg_elem,g_elem);

  // change viewport
  if(!existing){
    var [x,y,w,h] = svg_viewbox.split(" ");
    var ydiff = (layers.length*layer_dist);
    svg_elem.getElementsByClassName("definition-scale")[0].setAttribute("viewBox",[x,Number(y)-ydiff,w,Number(h)+ydiff].join(" "));
   
    var svg_num_height = Number(svg_height.split("p")[0]); //Assume "XYZpx"
    // change height
    svg_elem.children[0].setAttribute("height", (svg_num_height * ((h-(y-ydiff))/(h - y))) + "px");
  }
} 






