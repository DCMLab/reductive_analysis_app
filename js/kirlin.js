
function find_note(foo,measure) {
  var re = /(\d+)?(\w)(#|b?)(\d+)(?:-(\d+))?/;
  var res = re.exec(foo);
  if(!res || res[0] != foo)
    return;
  var measure;
  if(res[1] == undefined)
    measure = mei.getElementsByTagName("measure")[Number(measure)-1];
  else
    measure = mei.getElementsByTagName("measure")[Number(res[1])-1];
  if(measure.getAttribute("n") != res[1]){
    console.log("weird measure number, we looked for "+res[1]);
    console.log(measure);
  }
  var notes = measure.getElementsByTagName("note");
  var n = 0;
  for(note of Array.from(notes)){
    if(note.getAttribute("pname") == res[2] && note.getAttribute("oct") == Number(res[4]) &&
       ((!res[3] && (!note_get_accid(note) || note_get_accid(note) == "n"))
      || (res[3] == "#" && (note_get_accid(note) == "s" || note_get_accid(note) == "s"))
      || (res[3] == "b" && (note_get_accid(note) == "f" || note_get_accid(note) == "f")))){
      n += 1;
      if(n == Number(res[5]) || (n == 1 && res[5] == undefined)) 
        return note;
    }
  }
  console.log("failed to find note: "+foo);
}

function select_line(line) {
  var re = /(\(?)[\s]*([\w#b-]+)[\s]*\)?/g;
  var res = Array.from(line.match(re));
  var primary = true;
  // Why stick to a standard when you can not do that?
  var notere = /(\d+)(\w)(#|b?)(\d+)(?:-(\d+))?/;
  var noteres = notere.exec(res[0]);

  var notes = res.map((x) => {
        var re2 = /(\(?)[\s]*([\w#b-]+)[\s]*(\)?)/g;
        var res2 = Array.from(re2.exec(x));
        if(res2[1] == "(")
          primary = false;
        var note = [find_note(res2[2],noteres[1]),primary];
	if(!note[0])
	  console.log("failed to find "+x);
        if(res2[3] == ")")
          primary = true;
        return note;
  });
  notes.forEach((x) => {toggle_selected(get_by_id(document,x[0].getAttribute("xml:id")),x[1])})
  return notes;
}

function neighbour_notes(n0,n1) {
  var pitches = "abcdefg"
  var p0 = pitches.indexOf(n0.getAttribute("pname"));
  var p1 = pitches.indexOf(n1.getAttribute("pname"));
  if(p1 == mod(p0+1,pitches.length)){
    return 1;
  }
  if(p1 == mod(p0-1,pitches.length)){
    return -1;
  }
  return 0;
}


function handle_line(line){
 // Skip initial whitespace
 line = line.replace(/^\s*/,"");
 if(line[0] == "#" || line[0] == "c")
  return;
 // Why stick to one type of comment?
 line = line.replace(/\/\/.*/,"");
 // All the different explicit typing should probably be handled with
 // regex..
 if(line.match(/urlinie/)){
   select_line(line.replace("urlinie",""))
   do_hyperedge("urlinie");
 }else if(line.match(/bassbrech/)){
   select_line(line.replace("bassbrech",""))
   do_hyperedge("bassbrechung");
 }else if(line.match(/vert/)){
   select_line(line.replace("vert",""))
   do_hyperedge("vert");
 }else if(line.match(/initarp/)){
   select_line(line.replace("initarp",""))
   do_hyperedge("initarp");
 }else if(line.match(/initasc/)){
   select_line(line.replace("initasc",""))
   do_hyperedge("initasc");
 }else if(line.match(/linprog/)){
   select_line(line.replace("linprog",""))
   do_hyperedge("linprog");
 }else if(line.match(/interrupt/)){
   select_line(line.replace("interrupt",""))
   do_hyperedge("interrupt");
 }else if(line.match(/rep/)){
   select_line(line.replace("rep",""))
   do_hyperedge("repeat");
 }else if(line.match(/vex/)){
   line = line.replace("vex", "");
   line = line.split("/");
   select_line(line[0])
   do_hyperedge("vex");
   select_line(line[1])
   do_hyperedge("vex");
 } else if(line.match(/(\d+)(\w)(#|b?)(\d+)-(\d+)/)){
   var notes = select_line(line).map((n) => {return n[0];});
   var type = undefined;
   if(notes.length == 1)
     return;
   if(notes.length == 2){
     if(neighbour_notes(notes[0],notes[1]) != 0)
       //one-sided neighbour
       type = "neighbour";
   }else if(notes.length == 3) {
     var p0 = notes[0].getAttribute("pname");
     var p2 = notes[2].getAttribute("pname");
     if(p0 == p2 && neighbour_notes(notes[0],notes[1]))
       //two-sided neighbour
       type = "neighbour";
     else if(neighbour_notes(notes[0],notes[1]) != 0 &&
	     neighbour_notes(notes[1],notes[2]) != 0)
       //passing note
       type = "passing";
   }else {
     // Many notes
     var direction = neighbour_notes(notes[0],notes[1]);
     if(direction != 0){
       type = "passing";
       for(var i = 1; i<notes.length-1;i+=1)
	 if(neighbour_notes(notes[i],notes[i+1]) != direction)
	   type = undefined;
     }
   }
   do_hyperedge(type);
 }
}

//TODO: Load file, then handle each line from the file with handle_line:74
var analysis_data;

function add_kirlin_analysis(e) {
  analysis_data = reader.result;
  analysis_data.split("\n").forEach(handle_line);

}

