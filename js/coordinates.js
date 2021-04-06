//The functions in this file are all about converting clicks and mouse
//positions to musically salient information (pitch and time) given a
//Verovio-generated SVG.

var pnames = "cdefgab";

function getPointerSVGCoords() {
  // Find the system within the current draw context, and compute the local
  // SVG coordinates from its transformation matrix.
  var svg = current_draw_context.svg_elem.children[0];
  var system = current_draw_context.svg_elem.getElementsByClassName("system")[0];
  var pt = svg.createSVGPoint();
  pt.x = mouseX;
  pt.y = mouseY;
  return pt.matrixTransform(system.parentElement.getScreenCTM().inverse());
}

function compute_measure_map(draw_context) {
  // We compute the right edges of each measure so we can easily map into
  // which measure we are through a simple find() later
  let svg = draw_context.svg_elem;
  var measures = Array.from(svg.getElementsByClassName("measure"));
  var staves = Array.from(measures[0].getElementsByClassName("staff")); //Just look at one measure for now
  var notes = Array.from(svg.getElementsByClassName("note"));
  // We let the right edge of each measure make up the grid lines
  var measure_map = measures.map((msr) => [msr.getBBox().x + msr.getBBox().width, msr]); 
  measure_map.sort((x,y) => x - y);
  measure_map.reverse(); // Go from right
  return measure_map;
  // Maybe replace s.id with the 'n' of the staff in the MEI
}

function coord_measure(dc,pt) {
  // Find the current measure from the precomputed list of right edges
  let r = (dc.measure_map.find((p) => p[0] > pt.x));
  if(r)
    return r[1];
  else
    return undefined;
}

function staff_midpoint(staff) {
  // Verovio seems to draw the staff lines as the first five children of
  // the staff element, so we pick the middle line and compute its center
  // to get the center of the whole staff
  let line_rect = staff.children[2]. //Center staff line
    getBBox();
  return line_rect.y + (line_rect.height)/2;
}

function staff_third_distance(staff) {
  // The line between two staff lines is the distance between two notes a
  // third apart.
  let line_rect0 = staff.children[2]. //Center staff line
    getBBox();
  let line_rect1 = staff.children[1]. //Off-center staff line
    getBBox();
  return Math.abs(line_rect0.y - line_rect1.y);
}


function staff_divider(staff1, staff2) {
  // The midpoint between two staves
  let mid1 = staff_midpoint(staff1);
  let mid2 = staff_midpoint(staff2);
  return average2(mid1, mid2);
}

function coord_staff(dc, pt, measure) {
  // For now we don't precompute anything, but instead compute the
  // midpoints of each staff and find the correct one to return by
  // midpoints between midpoints
  var staves = Array.from(measure.getElementsByClassName("staff")); 
  var stave_coords = staves.map((s) => [staff_midpoint(s),s]);
  stave_coords.sort();
  var index_maybe = stave_coords.findIndex((s) => pt.y < s[0]);
  if(index_maybe == 0)
    return stave_coords[0][1];
  if(index_maybe == -1)
    return stave_coords[stave_coords.length - 1][1];
  const divider = average2(stave_coords[index_maybe - 1][0],
                           stave_coords[index_maybe     ][0]);
  if(pt.y < divider)
    return stave_coords[index_maybe - 1][1];
  else
    return stave_coords[index_maybe    ][1];
}

function diatonic_note_n(note) {
  // Given an SVG note, what is its signed interval in diatonic steps from C0
  var mei_note = get_by_id(mei,get_id(note));
  var pname = mei_note.getAttribute("pname");
  var oct = mei_note.getAttribute("oct");
  // Assume the above works for now
  return oct * 7 + (pnames.indexOf(pname));
}

function pitch_grid(staff,note) {
  // Given a staff and a reference note in that staff, give a function that
  // computes a pitch name and octave for a given y coordinate
  const mid = staff_midpoint(staff);
  const thrd = - Math.abs(staff_third_distance(staff));
  const snd = thrd/2;
  // What's the diatonic note number at the middle line of the staff
  const mid_n = diatonic_note_n(note) - Math.floor((note_coords(note)[1] - mid)/snd);
  
  return [(y) => {
    // What's the diatonic note number?
    // TODO: this may need adjustment by snd/2
    var diatonic_n = Math.floor((y + snd/2 - mid)/snd) + mid_n;
    var oct = Math.floor((diatonic_n)/ 7);
    var note = pnames[mod(diatonic_n, 7)];

    return [note,oct];
  },(pname,oct) => {
    var diatonic_n = oct*7 + pnames.indexOf(pname);
    return mid + (diatonic_n - mid_n)*snd;
  }]


}

function coord_pitch(dc,pt,staff) {
  // Compute the diatonic pitch that best matches a specific height
  // relative to a specific staff.
  var n = staff.getElementsByClassName("note")[0];
  // TODO: Handle if there are no notes in the current staff
//  var [y_to_p,p_to_y] = pitch_grid(staff,n);
  return staff.y_to_p(pt.y);
}

// Same procedure as for coord_staff, if we're not allowing new chords
function closest_note(dc,pt,staff) {
  var notes = Array.from(staff.getElementsByClassName("note")).map((n) => [note_coords(n)[0],n]);
  notes.sort();
  var index_maybe = notes.findIndex((n) => pt.x < n[0]);
  if(index_maybe == 0)
    return notes[0][1];
  if(index_maybe == -1)
    return notes[notes.length - 1][1];
  const divider = average2(notes[index_maybe - 1][0],
                           notes[index_maybe     ][0]);
  if(pt.x < divider)
    return notes[index_maybe - 1][1];
  else
    return notes[index_maybe    ][1];
}



function note_params() {
  // Compute the note parameters that make sense for the pointer position
  // at this particular time.
  // Return the pitch parameters (diatonic pitch name and octave) and the
  // event relative to which the note should be placed in the MEI
  // (simultaneous to or before - null for last)
  var dc = current_draw_context;
  const pt = getPointerSVGCoords();
  const measure = coord_measure(dc,pt);
  if(!measure){
    console.log("Pointer outside measures");
    return;
  }
  const staff   = coord_staff(dc,pt, measure);
  const [pname,oct]       = coord_pitch(dc,pt,staff);
  const sim_note = closest_note(dc,pt,staff);
//  const [rel_event,simul] = coord_event(dc,pt, staff, measure);
  return [pname,oct,sim_note];
}

function note_params_coords_sim(pname, oct, note) {
  var staff = note.closest(".staff"); //Assume we're in the same staff
  var n = staff.getElementsByClassName("note")[0];
  // TODO: Handle if there are no notes in the current staff
//  var [y_to_p,p_to_y] = pitch_grid(staff,note);
  return [note_coords(note)[0],staff.p_to_y(pname,oct)];
}

function show_note(pname, oct, note, sim=true, id="") {
  var dc = current_draw_context;
  var curr_elem = document.getElementById(id);
  if(curr_elem)
    curr_elem.parentElement.removeChild(curr_elem);
  if(sim){
    let [x,y] = note_params_coords_sim(pname, oct, note);
    // "Copy" the other note
    let [nx,ny] = note_coords(note);
    var u = document.createElementNS("http://www.w3.org/2000/svg", 'use');
    u.setAttributeNS('http://www.w3.org/1999/xlink',"href","#"+note.id);
    // And offset it with A Bit
    u.setAttribute("x",x-nx);
    u.setAttribute("y",y-ny);
    u.id = id;
    note.parentElement.appendChild(u);
  }
}





