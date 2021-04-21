


// Returns a list of list of IDs
function calc_hierarchy(notes, relations) {
  var ret = [];
  var rels = relations;
  var ns = notes.filter((x) => x != undefined);
  do{
    var [removed_relations, removed_notes] = calc_reduce(mei_graph, 
							 rels, 
							 rels);
    var ret_notes = removed_notes.filter((n) => ns.includes(n));
    ret.push(ret_notes);
    ns = ns.filter((x) => !removed_notes.includes(x))
    rels = rels.filter((x) => !removed_relations.includes(x))
  }while(removed_notes.length + removed_relations.length  > 0)
  ret.push(ns);
  return ret;
}

function draw_hierarchy_graph(draw_context, hullPadding=200) {
  var svg_elem = draw_context.svg_elem;
  var id_prefix = draw_context.id_prefix;
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
  var layers = calc_hierarchy(current_note_nodes,current_relation_nodes);
  
  var svg_height = svg_elem.children[0].getAttribute("height");
  var svg_viewbox = svg_elem.getElementsByClassName("definition-scale")[0].getAttribute("viewBox");
  // find top of system
  var svg_top = 0;
  var layer_dist = 500;

  // find coordinates
  var layers_coords = layers.flatMap((layer,ix) => layer.map((e) => {
	var n = document.getElementById(id_in_svg(draw_context,node_to_note_id(e)))
	var [x,y] = note_coords(n);
	return [e, [x,svg_top - layer_dist*ix]]
      }));
  console.log(hullPadding);

  // draw hierarchy
  current_relation_nodes.forEach((r) => {
    // ID, type, and original SVG elem
    var id = id_prefix + r.getAttribute("xml:id");
    var type = relation_type(r);
    var elem_in_score = document.getElementById(id);

    var nodes = relation_allnodes(mei_graph,r);
    var node_coords = nodes.map((n) => layers_coords.find((x) => x[0] == n)[1]);

    var elem = roundedHull(node_coords, hullPadding);
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
    add_to_svg_bg(svg_elem,elem);

  });

  // change viewport
  var [x,y,w,h] = svg_viewbox.split(" ");
  var ydiff = (layers.length*layer_dist);
  svg_elem.getElementsByClassName("definition-scale")[0].setAttribute("viewBox",[x,Number(y)-ydiff,w,Number(h)+ydiff].join(" "));
 
  var svg_num_height = Number(svg_height.split("p")[0]); //Assume "XYZpx"
  // change height
  svg_elem.children[0].setAttribute("height", (svg_num_height * ((h-(y-ydiff))/(h - y))) + "px");
  
} 






