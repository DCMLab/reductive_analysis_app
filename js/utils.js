
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


function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(4+Math.random() * 8)];
    }
    return color+'88'; //Semitransparency
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


var type_shades = {
  "repeat" : 'r',
  "prolongation" : 'r',
  "passing" : 'g',
  "neighbour" : 'b',
  "harmonic" : 'c',
  "arpeggio" : 'm',
  "arp" : 'm',
  "urlinie" : 'y',
  "bassbrechung" : 'y',
  "bassbrech" : 'y'
};

var button_shades = {
"repeathyperedgebutton" : "#AA2222",
"passinghyperedgebutton": "#22AA22",
"neighbourhyperedgebutton": "#2222AA",
"harmonichyperedgebutton": "#22AAAA",
"arpeggiohyperedgebutton": "#AA22AA",
"urliniehyperedgebutton": "#AAAA22",
"bassbrechunghyperedgebutton" : "#AAAA22",
};
