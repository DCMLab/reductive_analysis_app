
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

var roundedHull2 = function (polyPoints) {
    // Returns the path for a rounded hull around two points (a "capsule" shape).
  var hullPadding = 200;

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

var roundedHullN = function (polyPoints) {
  var hullPadding = 200;
    // Returns the SVG path data string representing the polygon, expanded and rounded.

    // Handle special cases
    if (!polyPoints || polyPoints.length < 1) return "";
    if (polyPoints.length === 1) return roundedHull1 (polyPoints);
    if (polyPoints.length === 2) return roundedHull2 (polyPoints);

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
  var sibling = document.getElementsByClassName("system")[0];
  var parent = sibling.parentNode;
  var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'path');
  newElement.setAttribute('fill', getRandomColor()); //TODO: Better colour picking
  if(points.length == 2) {
    newElement.setAttribute('d',roundedHull2(points));
  } else {
    newElement.setAttribute('d',roundedHullN(d3.polygonHull(points)));
  }
  parent.insertBefore(newElement,sibling);
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
  var sibling = document.getElementsByClassName("system")[0];
  var parent = sibling.parentNode;
  var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'line');
  newElement.setAttribute("x1",p1[0]);
  newElement.setAttribute("y1",p1[1]);
  newElement.setAttribute("x2",p2[0]);
  newElement.setAttribute("y2",p2[1]);
  newElement.style.stroke = "#000";
  newElement.style.strokeWidth = "15px"; 
  parent.appendChild(newElement);
  return newElement;
}

function note_coords(note) {
  return [note.getElementsByTagName("use")[0].x.animVal.value + 100,
          note.getElementsByTagName("use")[0].y.animVal.value]
}

function get_by_id(doc,id) {
  if (id[0] == "#") { id = id.slice(1); }
  var elem =  doc.querySelector("[*|id='"+id+"']");
  if(elem) {
    return elem;
  }else{
    return Array.from(doc.all).find((x) => { return x.getAttribute("id") == id || x.getAttribute("xml:id") == id; });
  }
}

function node_referred_to(id) {
  return Array.from(mei.getElementsByTagName("arc"))
    .filter((x) => {
	return (x.getAttribute("from") == "#"+id || 
		x.getAttribute("to") == "#"+id);
     }).length > 0;
}

function note_get_sameas(note) {
  return note.getElementsByTagName("label")[0].
	      getElementsByTagName("note")[0].
	      getAttribute("sameas");
}

function mod(n, m) {
  return ((n % m) + m) % m;
}

function note_get_accid(note) {
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

function hyperedge_get_notes(he) {
  if(document.contains(he))
    he = get_by_id(mei,he.id);
  var note_nodes = hyperedge_allnodes(he);
  var notes = note_nodes.map(note_get_sameas).map((n) => get_by_id(mei,n));
  return notes;

}

// Get the MEI-graph nodes that are adjacent to a hyperedge
function hyperedge_allnodes(he) {
  var arcs_array = Array.from(mei_graph.getElementsByTagName("arc"));
  var nodes = [];
  arcs_array.forEach((a) => {
        if(a.getAttribute("from") == "#"+he.getAttribute("xml:id")){
          nodes.push(get_by_id(mei,a.getAttribute("to")));
        }
      });
  return nodes;
}
// Get the MEI-graph nodes that are adjacent and primary to a hyperedge
function hyperedge_primaries(he) {
  var arcs_array = Array.from(mei_graph.getElementsByTagName("arc"));
  var nodes = [];
  arcs_array.forEach((a) => {
    if(a.getAttribute("from") == "#"+he.getAttribute("xml:id") &&
       a.getAttribute("type") == "primary"){
      nodes.push(get_by_id(mei,a.getAttribute("to")));
    }
      });
  return nodes;
}
// Get the MEI-graph nodes that are adjacent and secondary to a hyperedge
function hyperedge_secondaries(he) {
  var arcs_array = Array.from(mei_graph.getElementsByTagName("arc"));
  var nodes = [];
  arcs_array.forEach((a) => {
    if(a.getAttribute("from") == "#"+he.getAttribute("xml:id") &&
       a.getAttribute("type") == "secondary"){
      nodes.push(get_by_id(mei,a.getAttribute("to")));
    }
      });
  return nodes;
}

function add_mei_node_for(mei,mei_graph,note) {
    var id = note.getAttribute("id");
    var elem = get_by_id(mei,"gn-"+id);
    if (elem != null) {
      return elem;
    }
    elem = mei.createElement("node");
    // This node represent that note
    var label = mei.createElement("label");
    var note = mei.createElement("note");
    note.setAttribute("sameas","#"+id);
    elem.appendChild(label);
    label.appendChild(note);
    // But should have a separate XML ID
    elem.setAttribute("xml:id","gn-" + id);
    mei_graph.appendChild(elem);
    return elem;
}
            

function hide_note(note) {
  var elem = get_by_id(document,note_get_sameas(note));
  if(elem)
    elem.style.visibility = "hidden";
  return elem;
}

function hide_he(he) {
  var elem = get_by_id(document,he.getAttribute("xml:id"));
  if(elem) 
    elem.style.visibility = "hidden";
  return elem;
}

function mark_secondary(item) {
    var current = item.style.fillOpacity;
    if(!current)
      current = 1;
    item.style.fillOpacity = current * 0.5;
}

function unmark_secondary(item) {
    var current = item.style.fillOpacity;
    item.style.fillOpacity = current * 2;
}

function mark_secondaries(he) {
    if(!mei.contains(he))
      he = get_by_id(mei,he.id);
    var secondaries = hyperedge_secondaries(he);
    secondaries.forEach((n) => {
	var svg_note = get_by_id(document,note_get_sameas(n));
	mark_secondary(svg_note);
    });
}

function unmark_secondaries(he) {
    if(!mei.contains(he))
      he = get_by_id(mei,he.id);
    var secondaries = hyperedge_secondaries(he);
    secondaries.forEach((n) => {
	var svg_note = get_by_id(document,note_get_sameas(n));
	unmark_secondary(svg_note);
    });
}

function get_measure(elem) {if(elem.tagName == "measure") return elem; else return get_measure(elem.parentElement);}

function select_samenote() {
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
