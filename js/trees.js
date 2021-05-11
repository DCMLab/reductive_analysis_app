

function calculate_initial_y(node, min_dist) {
  if(node.children.length == 0){
    node.y = 0;
    return;
  }
  node.children.forEach((n) => calculate_initial_y(n,min_dist));
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
  if(node.children.length == 0)
    return;
  node.children.forEach(calculate_x);
  node.x = average(node.children.map((n) => n.x));
}

function align_tree(tree,list, min_dist = -500) {
  var leaves = gather_leaves(tree);
  if(leaves.length != list.length){
    console.log("Wrong length of list, expected "+leaves.length+" got "+list.length);
    return;
  }
  for(i in leaves){
    leaves[i].x = list[i];
  }
  calculate_x(tree);
  calculate_initial_y(tree, min_dist);
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



function draw_tree(draw_context, input ="",baseline=0, min_dist = -1000) {
  var svg_elem = draw_context.svg_elem;
  var id_prefix = draw_context.id_prefix;
  var svg_height = svg_elem.children[0].getAttribute("height");
  var svg_viewbox = svg_elem.getElementsByClassName("definition-scale")[0].getAttribute("viewBox");
  // find top of system
  var svg_top = 0;

  if(!input)
    input = document.getElementById(id_prefix+"treeinput").value;

  var tree_g = svg_elem.getRootNode().getElementById("tree"+id_prefix);
  var existing = tree_g ? true : false;
  if(existing)
    tree_g.parentNode.removeChild(tree_g);

  var tree = JSON.parse(input);
  var xlist = selected.concat(extraselected);
  if(selected.length == 1){
    if(selected[0].classList.contains("relation"))
      xlist = relation_get_notes(selected[0]).map((n) => note_coords(get_by_id(document,id_in_svg(draw_context,n.getAttribute("xml:id"))))[0]);
  }else if (selected[0].classList.contains("metarelation")){
    //Somehow calculate x-coordinates for relations and metarelations
  }else if (selected.length > 1){
    xlist = xlist.map((n) => note_coords(n)[0]);
  }else { //Test with all notes
    xlist = Array.from(svg_elem.getElementsByClassName("note")).map((n) => note_coords(n)[0]);
  } //TODO: once slicing is an option, try that.


  xlist.sort((a,b) => a - b);

  align_tree(tree,xlist, min_dist);


  var tree_g = draw_node(tree);

  tree_g.id = "tree"+id_prefix;

  add_to_svg_bg(svg_elem,tree_g);

  Array.from(tree_g.getElementsByTagName("text")).forEach(draw_textbox);

  // Adjust height
  // change viewport
  if(!existing){
    var [x,y,w,h] = svg_viewbox.split(" ");
    var ydiff = -tree.y;
    draw_context.old_viewbox = [x,y,w,h].join(" ");
    svg_elem.getElementsByClassName("definition-scale")[0].setAttribute("viewBox",[x,Number(y)-ydiff,w,Number(h)+ydiff].join(" "));
   
    var svg_num_height = Number(svg_height.split("p")[0]); //Assume "XYZpx"
    draw_context.old_height = svg_height;
    // change height
    svg_elem.children[0].setAttribute("height", (svg_num_height * ((h-(y-ydiff))/(h - y))) + "px");
  }// Else do Smart Calculations on old_viewbox

}



