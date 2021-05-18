

function calculate_initial_y(node, baseline, min_dist) {
  if(node.children.length == 0){
    node.y = baseline;
    return;
  }
  node.children.forEach((n) => calculate_initial_y(n,baseline, min_dist));
  node.y = min_dist + (node.children.map((n) => n.y).reduce((a,b) => a>b ?  a:b));
}


function adjust_y(node, parent_y, min_dist){
  if(node.children.length == 0)
    return;
  if(Math.abs(parent_y - node.y) > min_dist)
    node.y += ((parent_y - min_dist) - node.y)/2;
  node.children.forEach((n) => adjust_y(n,node.y,min_dist));
}


function gather_leaves(node) {
  if(node.children.length == 0)
    return [node];
  return node.children.flatMap(gather_leaves);
}

function calculate_x(node) {
  node.children.forEach(calculate_x);
  if(node.children.length == 0 || node.x != undefined)
    return;
  node.x = average(node.children.map((n) => n.x));
}

function place_tree(tree, baseline=0, min_dist = -500) {
  calculate_x(tree);
  calculate_initial_y(tree, baseline, min_dist);
  adjust_y(tree, tree.y, min_dist);
}

function draw_node(node,fontSize = 100) {
  var node_g = g();

  var node_text = text(node.label,[node.x,
                            node.y + (node.children.length == 0 ? fontSize : 0)]);
  node_text.style.fontFamiy = "sans-serif";
  node_text.style.fontSize =fontSize+"px";
  node_text.style.textAnchor="middle";
  node_text.classList.add("nodetext");

  var lines = node.children.map((n) => line([node.x,node.y],[n.x,n.y]));
  var subtrees = node.children.flatMap((n) => draw_node(n,fontSize));

  lines.forEach((l) => node_g.appendChild(l));
  subtrees.forEach((t) => node_g.appendChild(t));
  node_g.appendChild(node_text);

  return node_g;
}

function draw_textbox(txt, padding=25) {
  var bbox = txt.getBBox();
  var text_rect = rect([bbox.x-padding,bbox.y-padding],bbox.width+padding,bbox.height+padding);
  txt.parentNode.insertBefore(text_rect,txt);
}

function obj_tree_to_xml(json_tree) {
  var elem, elems;

  var lbl = mei.createElement("label");
  lbl.append(json_tree.label);
  console.log(json_tree.note_id);
  if(json_tree.note_id){
    var nt = mei.createElement("note");
    nt.setAttribute("sameas","#"+json_tree.note_id);
    lbl.appendChild(nt);
  }

  if(json_tree.children.length == 0){
    elem = mei.createElement("eLeaf");
  }else{
    elem = mei.createElement("eTree");
    elems = json_tree.children.map(obj_tree_to_xml);
  }

  elem.appendChild(lbl);
  if(elems)
    elems.forEach((e) => elem.appendChild(e));

  return elem;

}


function add_or_replace_tree(elem) {
  var pNode = mei_graph.parentNode;
  // TODO: Add tree index/id/foo
  // For now, remove any previous tree
  if(pNode.querySelector("eTree"))
    pNode.removeChild(pNode.querySelector("eTree"));
  pNode.appendChild(elem);
}

function xml_subtree_to_obj(elem){
  var lbl = elem.children[0]; // The first child is the label
  var obj = {
    "label": lbl.textContent,
  };
  if(lbl.children.length != 0){
    // Assume our structure - any label child is a note sameas
    // TODO: fix, obviously
    obj.note_id = lbl.querySelector("note").getAttribute("sameas").replace("#","");
  }
  var chlds = Array.from(elem.children);
  chlds.shift(); //Get rid of the label
  obj.children = chlds.map(xml_subtree_to_obj);
  return obj;

}


function xml_tree_to_obj(elem) {
  //TODO: any preprocessing or checks
  return xml_subtree_to_obj(elem);
  // Return an Object with label, children, and x-align node IDs
}

function find_x_tree(draw_context,tree){
  if(tree.note_id)
    tree.x = note_coords(get_by_id(document,id_in_svg(draw_context,tree.note_id)))[0];
  tree.children.forEach((n) => find_x_tree(draw_context,n));
}

function load_tree(draw_context) {
  var elem = mei.querySelector("eTree");
  if(!elem){
    console.log("No tree to load");
    return;
  }
  var obj = xml_tree_to_obj(elem);
  var str = JSON.stringify(obj);
  var input = document.getElementById(draw_context.id_prefix+"treeinput");
  input.value = str;

}

function get_tree_from_input(draw_context){
  var input = document.getElementById(draw_context.id_prefix+"treeinput");
  if(input.value == ""){
    console.log("No tree to be parsed");
    return;
  }
  var json = input.value;
  var obj = JSON.parse(json);
  if(!obj){
    console.log("Failed to parse tree.");
    return;
  }
  return obj;
}

function has_x_tree(obj) {
  var leaves = gather_leaves(obj);
  return leaves[0].hasOwnProperty("x");
}

function is_aligned_tree(obj) {
  var leaves = gather_leaves(obj);
  return leaves[0].hasOwnProperty("note_id");
}

function save_tree(draw_context) {
  var obj = get_tree_from_input(draw_context);
  if(!obj)
    return;
  var elem = obj_tree_to_xml(obj);
  add_or_replace_tree(elem);
}

function align_tree(draw_context) {
  var obj = get_tree_from_input(draw_context);
  if(!obj)
    return;

  var input = document.getElementById(draw_context.id_prefix+"treeinput");
  // Extracting a list of x coordinates from a set of notes
  var notelist = selected.concat(extraselected);
  if(selected.length == 0){
    notelist = Array.from(draw_context.svg_elem.getElementsByClassName("note"));
  }else if(selected.length == 1){
    if(selected[0].classList.contains("relation"))
      notelist = relation_get_notes(selected[0]).map((n) => get_by_id(document,id_in_svg(draw_context,n.getAttribute("xml:id"))));
  }else if (selected[0].classList.contains("metarelation")){
    //Somehow calculate x-coordinates for relations and metarelations
  }else if (selected.length > 1){
    //Just use the selected notes
  }

  var list = notelist.map((n) => [note_coords(n)[0],n]);


  list.sort((a,b) => a[0] - b[0]);

  var leaves = gather_leaves(obj);
  if(leaves.length != list.length){
    console.log("Wrong length of list, expected "+leaves.length+" got "+list.length);
    return;
  }
  for(i in leaves){
    leaves[i].x = list[i][0];
    leaves[i].note_id = list[i][1].id;
  }
  var str = JSON.stringify(obj);
  input.value = str;
}

function draw_tree(draw_context, baseline=0, min_dist=-1000) {
  var svg_elem = draw_context.svg_elem;
  var id_prefix = draw_context.id_prefix;

  var svg_height = svg_elem.children[0].getAttribute("height");
  var svg_viewbox = svg_elem.getElementsByClassName("definition-scale")[0].getAttribute("viewBox");
  // find top of system
  var svg_top = baseline;

  var tree_g = svg_elem.getRootNode().getElementById("tree"+id_prefix);
  var existing = tree_g ? true : false;
  if(existing)
    tree_g.parentNode.removeChild(tree_g);

  var obj = get_tree_from_input(draw_context);
  if(!obj){
    console.log("No tree in input, attempting to load from XML");
    load_tree(draw_context);
    obj = get_tree_from_input(draw_context);
    if(!obj)
      return;
  }

  if(!is_aligned_tree(obj)){
    //TODO: Allow non-aligned leaves
    console.log("Tree not aligned, attempting to align to selection");
    align_tree(draw_context);
    obj = get_tree_from_input(draw_context);
    if(!obj)
      return;
  }

  if(!has_x_tree(obj))
    find_x_tree(draw_context, obj);
  place_tree(obj, baseline, min_dist);

  var tree_g = draw_node(obj);

  tree_g.id = "tree"+id_prefix;

  add_to_svg_bg(svg_elem,tree_g);

  Array.from(tree_g.getElementsByTagName("text")).forEach(draw_textbox);

  // Adjust height
  // change viewport
  if(!existing){
    var [x,y,w,h] = svg_viewbox.split(" ");
    var ydiff = -obj.y;
    draw_context.old_viewbox = [x,y,w,h].join(" ");
    svg_elem.getElementsByClassName("definition-scale")[0].setAttribute("viewBox",[x,Number(y)-ydiff,w,Number(h)+ydiff].join(" "));
   
    var svg_num_height = Number(svg_height.split("p")[0]); //Assume "XYZpx"
    draw_context.old_height = svg_height;
    // change height
    svg_elem.children[0].setAttribute("height", (svg_num_height * ((h-(y-ydiff))/(h - y))) + "px");
  }// Else do Smart Calculations on old_viewbox

}



