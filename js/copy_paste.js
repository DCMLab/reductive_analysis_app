
var copy = {};

function do_copy() {
  let sel = selected.concat(extraselected);
  // Check for relations
  if(sel.length == 0 || !sel[0].classList.contains("relation")){
    console.log("No relation selected");
    return;
  }
  // Gather notes
  let ns = sel.flatMap((r) => relation_get_notes(get_by_id(mei,get_id(r))));
  // Create emplate map
  let ns_template = notes_template(ns);
  // Save relations and template map to global/static copy
  copy = {template : ns_template, rels : sel};
}

function do_paste() {
  if(!copy){
    console.log("No copy to paste");
    return;
  }
  let sel = selected.concat(extraselected);
  if(sel.length != 1 || !sel[0].classList.contains("note")){
    console.log("Pasting requires selecting a single note, for now.");
    return;
  }
  // Use selected note as root for comparison
  let n_ref = get_by_id(mei,get_id(sel[0]));
  let p_offs = copy.template.map((n) => n.p_off);
  p_offs = p_offs.sort((a,b) => a - b);
  // Find matching notes according to map
  let n_candidates = notes_in_range(n_ref, p_offs[0], 
                                           p_offs[p_offs.length-1],
					   copy.template[copy.template.length-1].t_off);
  
  copy.template.forEach((o) => o.n_to = undefined);
  for(n_cand of n_candidates){
    let t_off = time_offset(n_cand, n_ref)
    let p_off = pitch_offset(n_cand, n_ref)
    for(t_cand of copy.template){
      if(t_off == t_cand.t_off &&
	 p_off == t_cand.p_off) {
	// If two matching notes are found, give up
	if(t_cand.n_to != undefined){
	  console.log("Template mismatch: Found two matching notes: ", t_cand, n_cand);
	  return;
	}
	t_cand.n_to = n_cand;
      }
    }
  }
  // If some original note is unmatches, give up
  for(t of copy.template){
    if(t.n_to == undefined){
      console.log("Template mismatch: No matching note found: ",t);
      return;
    }
  }

  let dc = draw_context_of(sel[0]);
  toggle_selected(sel[0]);
  for(r of copy.rels){
    let rel = get_by_id(mei, get_id(r));
    let [prims, secs] = relation_get_notes_separated(rel);
    for(n of prims){
      let t = copy.template.find((t) => t.n_from == n);
      let svg_n = get_by_id(document, id_in_svg(dc,get_id(t.n_to)));
      toggle_selected(svg_n, true);
    }
    for(n of secs){
      let t = copy.template.find((t) => t.n_from == n);
      let svg_n = get_by_id(document, id_in_svg(dc,get_id(t.n_to)));
      toggle_selected(svg_n);
    }
    do_relation(r.getAttribute("type"));
  }


  // Go through each relation, select the corresponding notes, and
  // do_relation()
}


