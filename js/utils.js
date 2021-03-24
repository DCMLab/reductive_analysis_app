
// Vector operations, taken from 
// http://bl.ocks.org/hollasch/f70f1fe7700f092b5a505e3efd1d9232
var vecScale = function (scale, v) {
      // Returns the vector 'v' scaled by 'scale'.
      return [ scale * v[0], scale * v[1] ];
}

var vecSum = function (pv1, pv2) {
      // Returns the sum of two vectors, or a combination of a point and a
      // vector.
      return [ pv1[0] + pv2[0], pv1[1] + pv2[1] ];
}

var unitNormal = function (p0, p1) {
      // Returns the unit normal to the line segment from p0 to p1.
      var n = [ p0[1] - p1[1], p1[0] - p0[0] ];
      var nLength = Math.sqrt (n[0]*n[0] + n[1]*n[1]);
      return [ n[0] / nLength, n[1] / nLength ];
};

var roundedHull1 = function (polyPoints, hullPadding) {
  // Returns the path for a rounded hull around a single point (a
  // circle).

  var p1 = [polyPoints[0][0], polyPoints[0][1] - hullPadding];
  var p2 = [polyPoints[0][0], polyPoints[0][1] + hullPadding];

  return 'M ' + p1 + ' A ' + [hullPadding, hullPadding, '0,0,0', p2].join(',')
                   + ' A ' + [hullPadding, hullPadding, '0,0,0', p1].join(',');
};

var roundedHull2 = function (polyPoints, hullPadding) {
    // Returns the path for a rounded hull around two points (a "capsule" shape).

    var offsetVector = vecScale (hullPadding, unitNormal (polyPoints[0], polyPoints[1]));
    var invOffsetVector = vecScale (-1, offsetVector);
    // around that note coordinates are not at the centroids

    var p0 = vecSum (polyPoints[0], offsetVector);
    var p1 = vecSum (polyPoints[1], offsetVector);
    var p2 = vecSum (polyPoints[1], invOffsetVector);
    var p3 = vecSum (polyPoints[0], invOffsetVector);

    return 'M ' + p0
        + ' L ' + p1 + ' A ' + [hullPadding, hullPadding, '0,0,0', p2].join(',')
        + ' L ' + p3 + ' A ' + [hullPadding, hullPadding, '0,0,0', p0].join(',');
};

var roundedHullN = function (polyPoints, hullPadding) {
    // Returns the SVG path data string representing the polygon, expanded and rounded.

    // Handle special cases
    if (!polyPoints || polyPoints.length < 1) return "";
    if (polyPoints.length === 1) return roundedHull1 (polyPoints, hullPadding);
    if (polyPoints.length === 2) return roundedHull2 (polyPoints, hullPadding);

    var segments = new Array (polyPoints.length);

    // Calculate each offset (outwards) segment of the convex hull.
    for (var segmentIndex = 0;  segmentIndex < segments.length;  ++segmentIndex) {
        var p0 = (segmentIndex === 0) ? polyPoints[polyPoints.length-1] : polyPoints[segmentIndex-1];
        var p1 = polyPoints[segmentIndex];

        // Compute the offset vector for the line segment, with length = hullPadding.
        var offset = vecScale (hullPadding, unitNormal (p0, p1));

        segments[segmentIndex] = [ vecSum (p0, offset), vecSum (p1, offset) ];
    }

    var arcData = 'A ' + [hullPadding, hullPadding, '0,0,0,'].join(',');

    segments = segments.map (function (segment, index) {
        var pathFragment = "";
        if (index === 0) {
    	var pathFragment = 'M ' + segments[segments.length-1][1] + ' ';
        }
        pathFragment += arcData + segment[0] + ' L ' + segment[1];

        return pathFragment;
    });

    return segments.join(' ');
}


function roundedHull(points) {
  var hullPadding = 200;
  var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'path');
  newElement.setAttribute('fill', getRandomColor()); //TODO: Better colour picking
  if(points.length == 1) {
    newElement.setAttribute('d',roundedHull1(points, hullPadding));
  } else if(points.length == 2) {
    newElement.setAttribute('d',roundedHull2(points, hullPadding));
  } else {
    newElement.setAttribute('d',roundedHullN(d3.polygonHull(points), hullPadding));
  }
  return newElement;
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(4+Math.random() * 8)];
    }
    return color;
}

function getRandomShade(colour) {
    var letters = '0123456789ABCDEF';
    var shade = '#';
    for (var i = 0; i < 6; i++) {
      if(
	  ((colour == 'r' || colour == 'y' || colour == 'm')&& i < 2) ||
	  ((colour == 'g' || colour == 'y' || colour == 'c')&& (i < 4 && i > 1)) ||
	  ((colour == 'b' || colour == 'c' || colour == 'm')&& i > 3) 
	)
	shade += letters[14]//Math.floor(6+Math.random() * 8)];
      else 
	shade += letters[5];
    }
    return shade+'88'; //Semitransparency
}


// Draw a line between points p1 and p2
function line(p1,p2) {
  var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'line');
  newElement.setAttribute("x1",p1[0]);
  newElement.setAttribute("y1",p1[1]);
  newElement.setAttribute("x2",p2[0]);
  newElement.setAttribute("y2",p2[1]);
  newElement.style.stroke = "#000";
  newElement.style.strokeWidth = "15px"; 
  return newElement;
}

// Draw a circle at point p with radius rad
function circle(p,rad) {
  var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
  newElement.setAttribute("cx",p[0]);
  newElement.setAttribute("cy",p[1]);
  newElement.setAttribute("r",rad);
  newElement.style.stroke = "#000";
  newElement.style.strokeWidth = "15px"; 
  return newElement;
}

function flip_to_bg(elem) {
    var paren = elem.parentElement;
    paren.removeChild(elem);
    paren.insertBefore(elem,paren.children[0]);
}


function add_to_svg_bg_arg(svg_elem,newElement) {
  var sibling = svg_elem.getElementsByClassName("system")[0];
  var parent = sibling.parentNode;
  parent.insertBefore(newElement,sibling);
}

function add_to_svg_fg_arg(svg_elem,newElement) {
  var sibling = svg_elem.getElementsByClassName("system")[0];
  var parent = sibling.parentNode;
  parent.appendChild(newElement);
}

function g_arg(svg_elem) {
  var newElement = svg_elem.getRootNode().createElementNS("http://www.w3.org/2000/svg", 'g');
  return newElement;
}

// Note coordinates are off center by a bit
function note_coords(note) {
  return [note.getElementsByTagName("use")[0].x.animVal.value + 100,
          note.getElementsByTagName("use")[0].y.animVal.value]
}

function get_by_oldid_elem(doc,elem) {return get_by_id(doc, get_id(elem));}

// Gets all elements from the doc with the oldid
function get_by_oldid(doc,id){
  if (id[0] == "#") { id = id.slice(1); }
  var elems = doc.querySelectorAll("[*|oldid='"+id+"']");
  if(elems) {
    return Array.from(elems);
  }else{
    return Array.from(doc.all).find((x) => { return x.getAttribute("oldid") == id });
  }
}

// From id string to element
function get_by_id(doc,id) {
  if(!id)
    return null;
  if (id[0] == "#") { id = id.slice(1); }
  var elem =  doc.querySelector("[*|id='"+id+"']");
  if(elem) {
    return elem;
  }else{
    return Array.from(doc.getElementsByTagName("*")).find((x) => { return x.getAttribute("id") == id || x.getAttribute("xml:id") == id; });
  }
}

// Simple utility to get oldid if available.
function id_or_oldid(elem){
  if(elem.hasAttribute("oldid"))
    return elem.getAttribute("oldid");
  else
    return elem.id;
}

// More complex utility to fully search until we find the "basic" ID, in
// either the MEI or the document

function get_id(elem) {
  console.debug("Using globals: document, mei")
  if(document.contains(elem)){
    // SVG traversal
    if(!elem.hasAttribute("oldid"))
      return elem.id;
    else
      return get_id(document.getElementById(elem.getAttribute("oldid")))
  }else if(mei.contains(elem)){
    // MEI traversal
    if(elem.hasAttribute("sameas"))
	return get_id(get_by_id(mei,elem.getAttribute("sameas")))
    else if(elem.hasAttribute("copyof"))
	return get_id(get_by_id(mei,elem.getAttribute("copyof")))
    else if(elem.hasAttribute("xml:id"))
        return elem.getAttribute("xml:id")
  }
}



// From graph node to list of all arcs that refer to it
function arcs_where_node_referred_to_arg(mei_graph,id) {
  return Array.from(mei_graph.getElementsByTagName("arc"))
    .filter((x) => {
	return (x.getAttribute("from") == "#"+id || 
		x.getAttribute("to") == "#"+id);
     }).length > 0;
}

// From graph node to list of all arcs that refer to it
function node_referred_to(id) {
  console.debug("Using global: mei to find element");
  return Array.from(mei.getElementsByTagName("arc"))
    .filter((x) => {
	return (x.getAttribute("from") == "#"+id || 
		x.getAttribute("to") == "#"+id);
     }).length > 0;
}

// From MEI graph node to the note inte the layer referring to the same one
function note_get_sameas_layer(layer_context, node) {
  var id = node.getElementsByTagName("label")[0].
	      getElementsByTagName("note")[0].
	      getAttribute("sameas");
  var pair = layer_context.id_mapping.find((x) => ("#"+x[1]) == id);
  if(pair)
    return pair[0];
  else
    return null;
}

// From MEI graph node to the note as drawn in the draw context
function note_get_sameas_drawn(draw_context, note) {
  var layer_note = note_get_sameas_layer(draw_context.layer, note);
  return "#"+draw_context.id_prefix + layer_note;
}


// From MEI graph node to its referred note.
function note_get_sameas_prefix(prefix,note) {
  return note.getElementsByTagName("label")[0].
	      getElementsByTagName("note")[0].
	      getAttribute("sameas").replace("#","#"+prefix);
}

// From MEI graph node to its referred note.
function note_get_sameas(note) {
  return note.getElementsByTagName("label")[0].
	      getElementsByTagName("note")[0].
	      getAttribute("sameas");
}

// Always-positive modulo
function mod(n, m) {
  return ((n % m) + m) % m;
}

// What's the accidentals for this note?
function note_get_accid(note) {
  console.debug("Using globals: document, mei to find element");
  if(document.contains(note))
    note = get_by_id(mei,note.id);
  if(note.hasAttribute("accid.ges"))
      return note.getAttribute("accid.ges");
  if(note.hasAttribute("accid"))
      return note.getAttribute("accid");
  if(note.children.length == 0)
      return "";
  var accids = note.getElementsByTagName("accid");
  if(accids.length == 0)
    return "";
  var accid = accids[0]; //We don't care if there's more than one.
  if(accid.hasAttribute("accid.ges"))
      return accid.getAttribute("accid.ges");
  if(accid.hasAttribute("accid"))
      return accid.getAttribute("accid");
  return "";
}

// Get the timestamp for a note
function get_time(note) {
  console.debug("Using globals: document, mei to find element");
  if(document.contains(note))
    note = get_by_id(mei,note.id);
  return vrvToolkit.getTimeForElement(note.getAttribute("xml:id"));
}


// From any relation element to list of MEI note elements
function relation_get_notes(he) {
  he = get_by_id(mei,get_id(he));
  var note_nodes = relation_allnodes_arg(mei_graph,he);
  var notes = note_nodes.map(note_get_sameas).map((n) => get_by_id(mei,n));
  return notes;

}
// From any relation element to list of MEI note elements
function relation_get_notes_separated(he) {
  he = get_by_id(mei,get_id(he));
  var prim_nodes = relation_primaries_arg(mei_graph,he);
  var prims = prim_nodes.map(note_get_sameas).map((n) => get_by_id(mei,n));
  var sec_nodes = relation_secondaries_arg(mei_graph,he);
  var secs = sec_nodes.map(note_get_sameas).map((n) => get_by_id(mei,n));
  return [prims,secs];
}

// Get the MEI-graph nodes that are adjacent to a relation
function relation_allnodes_arg(mei_graph,he) {
  var arcs_array = Array.from(mei_graph.getElementsByTagName("arc"));
  var nodes = [];
  arcs_array.forEach((a) => {
        if(a.getAttribute("from") == "#"+he.getAttribute("xml:id")){
          nodes.push(get_by_id(mei_graph.getRootNode(),a.getAttribute("to")));
        }
      });
  return nodes;
}

// Get the MEI-graph nodes that are adjacent and primary to a relation
function relation_primaries_arg(mei_graph,he) {
  var arcs_array = Array.from(mei_graph.getElementsByTagName("arc"));
  var nodes = [];
  arcs_array.forEach((a) => {
    if(a.getAttribute("from") == "#"+he.getAttribute("xml:id") &&
       a.getAttribute("type") == "primary"){
      nodes.push(get_by_id(mei_graph.getRootNode(),a.getAttribute("to")));
    }
      });
  return nodes;
}
// Get the MEI-graph nodes that are adjacent and secondary to a relation
function relation_secondaries_arg(mei_graph,he) {
  var arcs_array = Array.from(mei_graph.getElementsByTagName("arc"));
  var nodes = [];
  arcs_array.forEach((a) => {
    if(a.getAttribute("from") == "#"+he.getAttribute("xml:id") &&
       a.getAttribute("type") == "secondary"){
      nodes.push(get_by_id(mei_graph.getRootNode(),a.getAttribute("to")));
    }
      });
  return nodes;
}

function relation_type(he) {
  //TODO: Sanity checks
  if(he.children.length == 0) {
    return "";
  }else{
    return he.children[0].getAttribute("type");
  }
}

// Set up new graph node for a note
function add_mei_node_for_arg(mei_graph,note) {
    var id = get_id(note);
    var elem = get_by_id(mei_graph.getRootNode(),"gn-"+id);
    if (elem != null) {
      return elem;
    }
    elem = mei_graph.getRootNode().createElement("node");
    // This node represent that note
    var label = mei_graph.getRootNode().createElement("label");
    var note = mei_graph.getRootNode().createElement("note");
    note.setAttribute("sameas","#"+id);
    elem.appendChild(label);
    label.appendChild(note);
    // But should have a separate XML ID
    elem.setAttribute("xml:id","gn-" + id);
    mei_graph.appendChild(elem);
    return elem;
}

            
// Find graphical element and hide it
function hide_note_arg(draw_context,note) {
  var elem = get_by_id(draw_context.svg_elem.getRootNode(),note_get_sameas_prefix(draw_context.id_prefix,note));
  if(elem)
    elem.classList.add("hidden");
  return elem;
}

// Find graphical element and hide it
function hide_he_arg(draw_context,he) {
  var elem = get_by_id(draw_context.svg_elem.getRootNode(),draw_context.id_prefix + he.getAttribute("xml:id"));
  if(elem) 
    elem.classList.add("hidden");
  return elem;
}
// Secondaries are greyed out
function mark_secondary(item) {
  if(item.classList.contains("secondarynote")) {
    var level = getComputedStyle(item).getPropertyValue("--how-secondary");
    item.style.setProperty("--how-secondary", level*2);
  }else{
    item.classList.add("secondarynote");
    item.style.setProperty("--how-secondary", 2);
  }
}

// No longer a secondary - bring it back
function unmark_secondary(item) {
  var level = getComputedStyle(item).getPropertyValue("--how-secondary");
  item.style.setProperty("--how-secondary", level/2);
  if(level/2 == 1)
    item.classList.remove("secondarynote");
}

// For a certain relation, find its secondaries and mark them
function mark_secondaries_arg(draw_context,mei_graph,he) {
    var mei = draw_context.mei;
    var svg_elem = draw_context.svg_elem;
    if(he.tagName != "node")
      he = get_by_id(mei_graph.getRootNode(),he.id);
    var secondaries = relation_secondaries_arg(mei_graph,he);
    secondaries.forEach((n) => {
	var svg_note = get_by_id(svg_elem.getRootNode(),note_get_sameas_prefix(draw_context.id_prefix,n));
	mark_secondary(svg_note);
    });
}

// For a certain relation, find its secondaries and unmark them
function unmark_secondaries_arg(draw_context,mei_graph,he) {
    var mei = draw_context.mei;
    var svg_elem = draw_context.svg_elem;
    if(he.tagName != "node")
      he = get_by_id(mei_graph.getRootNode(),he.id);
    var secondaries = relation_secondaries_arg(mei_graph,he);
    secondaries.forEach((n) => {
	var svg_note = get_by_id(svg_elem.getRootNode(), note_get_sameas_prefix(draw_context.id_prefix, n));
	unmark_secondary(svg_note);
    });
}

//Find the measure this MEI score element occurs in
function get_measure(elem) {if(elem.tagName == "measure") return elem; else return get_measure(elem.parentElement);}

// If we have a single note selected, find all other notes of the same
// pitch in this measure, and select them as secondary, and the previously
// selected one as primary
function select_samenote() {
  console.debug("Using globals: document, mei to find elems");
  if((selected.length == 1 || extraselected.length == 1)
   && !(selected.length == 1 &&  extraselected.length == 1)){
    var svg_note;
    if(selected.length == 1)
      svg_note = selected[0];
    else
      svg_note = extraselected[0];
    var note = get_by_id(mei,svg_note.getAttribute("id"));
    var measure = get_measure(note);
    var candidates = Array.from(measure.getElementsByTagName("note"));
    candidates.forEach((x) => { if(
    	      x.getAttribute("oct") == note.getAttribute("oct") &&
    	      x.getAttribute("pname") == note.getAttribute("pname")) {
          toggle_selected(get_by_id(document,x.getAttribute("xml:id")));
        }
        });
    //This is an ugly hack
    toggle_selected(svg_note,true);
  }
}

function svg_find_from_mei_elem(svg_elem, id_prefix, e) {
  if(!e)
    return null;
  // TODO: Sanity checks
  var id = id_prefix + e.getAttribute("xml:id");
  return svg_elem.getRootNode().getElementById(id);
}

function getBoundingBoxTop (elem) {
    // use the native SVG interface to get the bounding box
    var bbox = elem.getBBox();
    // return the center of the bounding box
    return bbox.y + bbox.height;
}

function get_class_from_classlist(elem){
  // TODO: If more things can be selected etc., it should be reflected here
  var ci = "";
  if(elem.classList.contains("note"))
      ci = "note";
  else if(elem.classList.contains("relation"))
      ci = "relation";
  else if(elem.classList.contains("metarelation"))
      ci = "metarelation";
  return ci;
}


function getBoundingBoxCenter (elem) {
    // use the native SVG interface to get the bounding box
    var bbox = elem.getBBox();
    // return the center of the bounding box
    return [bbox.x + bbox.width/2, bbox.y + bbox.height/2];
}

function getBoundingBoxOffCenter (elem) {
    // use the native SVG interface to get the bounding box
    var bbox = elem.getBBox();
    // return the center of the bounding box
    if(bbox.height > 500){
      return [bbox.x + bbox.width/2, bbox.y +200];
    }
    return [bbox.x + bbox.width/2, bbox.y + bbox.height/2];
}

function get_metarelation_target(elem) {
  if(elem.classList.contains("metarelation")){
    var circ= elem.getElementsByTagName("circle")[0];
    return [circ.cx.baseVal.value,circ.cy.baseVal.value];
  }else if (elem.classList.contains("relation")) {
    return getBoundingBoxCenter(elem);
  }else{
    console.log("wtf");
    console.log(elem);
    return [0,0];
  }

}

function is_empty_relation(elem) {
  return relation_get_notes(elem).length == 0;
}

function is_note_node(elem) {
  notes = elem.getElementsByTagName("note");
  return elem.tagName ="node" && notes.length == 1 && notes[0].getAttribute("sameas");
}


function remove_empty_relations(graph) {
  Array.from(graph.getElementsByTagName("node")).forEach((elem) => {
      if(!is_note_node(elem) && is_empty_relation(elem)){
        elem.parentNode.removeChild(elem);
      }
  });
}


function average(l) {return l.reduce((a,b) => a + b, 0)/l.length;}

function to_text_arg(draw_contexts,mei_graph,elems) {
  //TODO: Detect and warn for selections spanning several drawing contexts
  if(elems.length == 0)
    return "";
  if(elems[0].classList.contains("note")){
    return "notes("+elems.map((elem) => {
      var id = get_id(elem);
      var mei_elem = get_by_id(mei,id);
      var accid = note_get_accid(mei_elem);
      accid= accid.replace(/s/g,"#")
      accid= accid.replace(/f/g,"b")
      accid= accid.replace(/n/g,"")
      return mei_elem.getAttribute("pname")+accid+mei_elem.getAttribute("oct");
    }).join("; ")+")";
  }else if(elems[0].classList.contains("relation")){
    return "relations("+elems.map((elem) => elem.getAttribute("type")).join("; ")+")";
  }else if(elems[0].classList.contains("metarelation")){
    return "metarelations("+elems.map((elem) => elem.getAttribute("type")).join("; ")+")";
  }
}

function to_text(elems) {
  if(elems.length == 0)
    return "";
  if(elems[0].classList.contains("note")){
    return "notes("+elems.map((elem) => {
      var mei_elem = get_by_id(mei,elem.id);
      var accid = note_get_accid(mei_elem);
      accid= accid.replace(/s/g,"#")
      accid= accid.replace(/f/g,"b")
      accid= accid.replace(/n/g,"")
      return mei_elem.getAttribute("pname")+accid+mei_elem.getAttribute("oct");
    }).join("; ")+")";
  }else if(elems[0].classList.contains("relation")){
    return "relations("+elems.map((elem) => elem.getAttribute("type")).join("; ")+")";
  }else if(elems[0].classList.contains("metarelation")){
    return "metarelations("+elems.map((elem) => elem.getAttribute("type")).join("; ")+")";
  }
}

function fix_synonyms(mei) {
  Array.from(mei.getElementsByTagName("node")).forEach((elem) => {
    if(elem.getAttribute("type") == "hyperedge")
      elem.setAttribute("type","relation");
    if(elem.getAttribute("type") == "metaedge")
      elem.setAttribute("type","metarelation");
  });
  return mei;
}

function note_to_rest(mei,note) {
  mei.createElementNS("http://www.music-encoding.org/ns/mei", 'rest');
  rest.setAttribute("xml:id","rest-"+note.getAttribute("xml:id"));
  rest.setAttribute("dur",note.getAttribute("dur"));
  rest.setAttribute("n",note.getAttribute("n"));
  rest.setAttribute("dots",note.getAttribute("dots"));
  rest.setAttribute("when",note.getAttribute("when"));
  rest.setAttribute("layer",note.getAttribute("layer"));
  rest.setAttribute("staff",note.getAttribute("staff"));
  rest.setAttribute("tstamp.ges",note.getAttribute("tstamp.ges"));
  rest.setAttribute("tstamp.real",note.getAttribute("tstamp.real"));
  rest.setAttribute("tstamp",note.getAttribute("tstamp"));
  rest.setAttribute("loc",note.getAttribute("loc"));
  rest.setAttribute("dur.ges",note.getAttribute("dur.ges"));
  rest.setAttribute("dots.ges",note.getAttribute("dots.ges"));
  rest.setAttribute("dur.metrical",note.getAttribute("dur.ges"));
  rest.setAttribute("dur.ppq",note.getAttribute("dur.ppq"));
  rest.setAttribute("dur.real",note.getAttribute("dur.real"));
  rest.setAttribute("dur.recip",note.getAttribute("dur.recip"));
  rest.setAttribute("beam",note.getAttribute("beam"));
  rest.setAttribute("fermata",note.getAttribute("fermata"));
  rest.setAttribute("tuplet",note.getAttribute("tuplet"));
  //That's all I can think of. There's probably a better
  //way to do this..
}


function prefix_ids(elem,prefix) {
  if(elem.id){
    // SVG modification
    elem.setAttribute("oldid", elem.id);
    elem.id = prefix+elem.id;
  }
  if(elem.getAttribute("xml:id")){
    // MEI modification
    // No need to set oldid - we have already made links using
    // copyof/sameas
    elem.setAttribute("xml:id", prefix+elem.getAttribute("xml:id"));
  }
  Array.from(elem.children).forEach((e) => prefix_ids(e,prefix));
}

function clone_mei(mei) {
  var new_mei = mei.implementation.createDocument(
	mei.namespaceURI, //namespace to use
	null,                     //name of the root element (or for empty document)
	null                      //doctype (null for XML)
      );
  var newNode = new_mei.importNode(
          mei.documentElement, //node to import
	  true                         //clone its descendants
      );
  new_mei.appendChild(newNode);
  return new_mei;
}

function get_id_pairs(elem) {
  var item;
  if(elem.id)
    item = [elem.id , get_id(elem)]
  else if(elem.hasAttribute("xml:id"))
    item = [elem.getAttribute("xml:id") , get_id(elem)]
  return [item].concat(Array.from(elem.children).flatMap(get_id_pairs))
}









