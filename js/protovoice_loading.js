
// This files contains functions to load and process JSON data as produced
// by the Haskell protovoice model library.

//Various comparison utilities
function notes_equals(n1, n2) {
  return (n1.sFifth != undefined && n1.sFifth == n2.sFifth) || n1 == n2; 
}

function edges_equals(e1, e2) {
  return e1.length == e2.length && e1.map((n,i) => notes_equals(n, e2[i])).reduce((a,b) => a && b);
}

function orig_equals(o1, o2) {
  for([k,v] of Object.entries(o1)){
    v2 = o2[k];
    if(v2){
      return v2 == v || notes_equals(v,v2) || edges_equals(v,v2);
    }
  }
  return false;
}

// Find the notes in the measure that matches the note n
function matching_notes_in_measure(measure, n){
  
  [p,a] = fifths_to_diatonic(n.sFifth);
  let mei_ns = Array.from(measure.querySelectorAll("note[pname="+p+"]"));
  mei_ns = mei_ns.filter((n) => note_get_accid(n) == a);
  //TODO: Add octave comparison if available
  return mei_ns;
}

// Given a slice, annotate the notes therein with matching note IDs from
// the measure
function match_measure_to_slice(measure, slice) {
  slice["notes-origs"].forEach((o) => {
    o.mei_ns = matching_notes_in_measure(measure, o.note);
  });
}


// This matches the measures to the foot transitions, in particular walking
// through pairs of measures and noting which MEI notes could match each
// note in each slice 
function match_foot(measures, foot) {
  for(i in foot){
    let measure1, measure2;
    slice1 = foot[i][0][2];
    edges = foot[i][1];
    slice2 = foot[i][2][2];
    if(i > 0){
      measure1 = measures[i-1];
      match_measure_to_slice(measure1, slice1);
    }
    if(i < foot.length-1){
      measure2 = measures[i];
      match_measure_to_slice(measure2, slice2);
    }
  }
}

// Here we copy the information extracted from the sliced measures into the
// foot representation, and copy this information into the separated
// slices. We also set some initial variables in the slice array for
// further use later on.
function copy_foot_to_slices(foot, slices) {
  var footslices = foot.map((t) => t[0])
  footslices.push(foot[foot.length-1][2])
  var footdict = Object.fromEntries(footslices.map((s) => [s[1],s]));
  for(s of slices){
    var fs = footdict[s[1]];
    if(fs){
      s[0] = fs[0];
      s[1] = fs[1];
      s[2] = fs[2];
      // Mark as set
      s[3] = true;
      s[4] = [];
    }
  }
}

// This combines the potential matching MEI IDs from two child slices into
// their parent slice
function match_hori_slices(s_orig, s1, s2){
  let sn1 = s1[2]["notes-origs"];
  let sn2 = s2[2]["notes-origs"];
  for(n of s_orig[2]["notes-origs"]){
    let candidates = sn1.filter((sn) => 
	                            notes_equals(sn.note, n.note) &&
	                            orig_equals(sn.orig,  n.orig));
    candidates = candidates.concat(sn2.filter((sn) => 
	                            notes_equals(sn.note, n.note) &&
	                            orig_equals(sn.orig,  n.orig)));
    n.mei_ns = Array.from(new Set(candidates.flatMap((sn) => sn.mei_ns)));
    if(n.mei_ns.length == 0)
      console.log("No candidate notes found for note in horizontalisation:",n, sn1, sn2);
    
  }
  return s_orig;
}

// This function propagates the information about which MEI notes could be
// the/a represntative of some specific note in an inner (horizontalized)
// slice, using the simple slice-to-slice relations encoded in the hori
// edges. We also mark the "topmost" slices and "subsumed" slices as such
// in the fourth element of the slice array.
function propagate_slices_through_horiedges(slices, hori_edges) {
  var slicedict = Object.fromEntries(slices.map((s) => [s[1],s]));
  var slices_left = slices.filter((s) => s.length == 3);
  while(slices_left.length > 0){
    for(s of slices_left){
      let horis = hori_edges.filter(([s1,s2]) =>  s1[1] == s[1]);
      if(horis.length == 2){
	let [hid1,hid2] = horis.map((h) => h[1][1]);
       	if(slicedict[hid1].length > 3 && slicedict[hid2].length > 3){
	  s = match_hori_slices(s,slicedict[hid1], slicedict[hid2]);
	  s[3] = true;
	  s[4] = [hid1,hid2].concat([hid1,hid2].flatMap((i) => slicedict[i][4]));
	  slicedict[hid1][3] = false;
	  slicedict[hid2][3] = false;
	}
      }
    }
    slices_left = slices.filter((s) => s.length == 3);
  }
}


// Given a note, a number of candidates for its two parents, add all the
// potential relations to the draw context
function annotate_twosided_note_origins(note, lparents, rparents, relation, draw_context) {
  let mapped_ns = Array.from(new Set(note.mei_ns.map((n) => get_id(n))));
  let mapped_ls = Array.from(new Set(lparents.flatMap((l) => l.mei_ns.map((n) => get_id(n)))));
  let mapped_rs = Array.from(new Set(rparents.flatMap((r) => r.mei_ns.map((n) => get_id(n)))));
  for(n of mapped_ns){
    let nid = id_in_svg(draw_context, n);
    for(lpn of mapped_ls){
      let lpid = id_in_svg(draw_context, lpn);
      for(rpn of mapped_rs) {
	let rpid = id_in_svg(draw_context, rpn);
	toggle_selected(document.getElementById(nid));
	toggle_selected(document.getElementById(lpid), true);
	toggle_selected(document.getElementById(rpid), true);
	do_relation(relation);
      }
    }
  }
}

// Given a note, a number of candidates for its single parents, add all the
// potential relations to the draw context
function annotate_onesided_note_origins(note, parents, relation, draw_context) {
  let mapped_ns = Array.from(new Set(note.mei_ns.map((n) => get_id(n))));
  for(n of mapped_ns){
    let nid = id_in_svg(draw_context, n);
    let mapped_ps = Array.from(new Set(parents.flatMap((p) => p.mei_ns.map((n) => get_id(n)))));
    for(pn of mapped_ps){
      let pid = id_in_svg(draw_context, pn);
      console.log(nid,pid);
      toggle_selected(document.getElementById(nid));
      toggle_selected(document.getElementById(pid), true);
      do_relation(relation);
    }
  }
}

// From the note n as referred to in the transition t, build a list of
// lists of potential middle notes to this passing motion.
function yield_passing_middles(n,t) {
  // We have a note generated from some PassingMid/Left/Right
  // and the transition the passing motion continued in if Left/Right

  // The base case is that this note came from a PassingMid
  if(n.orig.hasOwnProperty("PassingMid"))
    return n.mei_ns.map((i) => [i]);

  // Otherwise we need to dig out the possible continuations from the
  // transition, and for that we need to look at the origin of the current
  // note

  // We start by building a comparator to find the NT edges that may be
  // continuing the passing motion in the transition
  let le;
  if(n.orig.hasOwnProperty("PassingLeft")) {
    le = [n.note,n.orig.PassingLeft[1]];
  } else {
    le = [n.orig.PassingLeft[0],n.note];
  }
  // This gives us a number of NT edges which have been decorated with the
  // note/transition pairs that could come from it
  let next_edges = t[1].edgesNT.filter((e) => edges_equals([e[0],e[1]], le));
  // So we recurse through these pairs
  let more_middle_notes = next_edges.flatMap((e) => { let [nn,nt] = e[2]; return yield_passing_middles(nn,nt)});
  let returns = [];
  // And then combine the choices for this note with the choices for the
  // continuation
  for(mei_n of n.mei_ns)
    for(ms of more_middle_notes)
      if(n.orig.hasOwnProperty("PassingLeft")) 
	returns.push([mei_n].concat(ms));
      else
	returns.push(ms.concat([mei_n]));
  return returns;
}

//Navigate the datastructure to find whether t1 has a nonterminal edge that
//refers to t2
function passing_referral(t1,t2) {
  let ntedges = t1[1].edgesNT;
  let referrals = ntedges.map((e) => e.filter((f,i) => i > 1));
  return referrals.flat().map((i) => i[1]).includes(t2);
}

// Passing motions require a different approach than the other note
// generating relations, which are all "local" in the outer graph. Passing
// motions, in contrast, come from an NT edge introduced in a
// horizontalisation, so need a more complex two-stage computation.
// The first stage is accomplished concurrently with the other local
// annotations, and entail marking each nonterminal edge with the
// note-transition pairs its explication could have resulted in, in the
// score in question. I.e. if a passing motion A-D has been filled in to
// A-B-C-D, there is a transition where A-D is a NT edge and one where
// (e.g.) B-D is one, and the first stage will mark the B-D edge with the C
// it generated, while the A-D edge will be marked with both B, and the
// transition which continues the passing motion afterwards. This function
// finds the "rootiest" NT edges, calls yield_passing_middles to navigate
// the above mentioned references, and then annotates the actual passing
// relation.
function annotate_passings(slices, transitions, draw_context) {
  //Find the transitions with nonterminal edges with candidates in them
  //Find the candidate left and right notes, according to the NT edge
  //Choose a selection of passing notes

  var passing_transitions = transitions.filter((t) => t[3] && t[1].edgesNT.length > 0);
  // Time to move the information on passing notes from the top to the
  // bottom of any stacks of equivalent edges
  passing_transitions.filter((t) => t.length > 4).forEach((t) =>  {
      let top_t = t[4].filter((tr) => tr.length == 4)[0];
      t[1] = top_t[1];
  });
  // These are the transitions where a passing motion begins.
  var root_passings = passing_transitions.filter((t) => {
      let referrals = passing_transitions.filter((tr) => passing_referral(tr,t))
      return referrals.length == 0;
    });
  for(t of root_passings){
    let lps = slices.find((s) => s[1] == t[0][1]);
    let rps = slices.find((s) => s[1] == t[2][1]);
    for(e of t[1].edgesNT.filter((e) => e.length > 2)){
      let [l,r] = e;
      let lcandidates = lps[2]['notes-origs'].filter((n) => notes_equals(l, n.note));
      let rcandidates = rps[2]['notes-origs'].filter((n) => notes_equals(r, n.note));
      // Left and right ends of the passing motion
      let mapped_ls = Array.from(new Set(lcandidates.flatMap((l) => l.mei_ns.map((n) => get_id(n)))));
      let mapped_rs = Array.from(new Set(rcandidates.flatMap((r) => r.mei_ns.map((n) => get_id(n)))));
      // Middle note(s) of the passing motion
      for(i in e){
	if(i > 1){
	  let [n,t] = e[i];
	  let middle_alts = yield_passing_middles(n,t);
	  for(l of mapped_ls){
	    let lpid = id_in_svg(draw_context,l);
	    for(r of mapped_rs){
	      let rpid = id_in_svg(draw_context,r);
	      for(ms of middle_alts){
		console.log(ms);
		let mids = ms.map((m) => id_in_svg(draw_context,get_id(m)));
		toggle_selected(document.getElementById(lpid),true);
		toggle_selected(document.getElementById(rpid),true);
		console.log(mids);
		mids.forEach((id) => toggle_selected(document.getElementById(id)));
		do_relation("passing");
	      }
	    }
	  }
	}
      }
    }
  }
}

// Here we work through the transitions and find transitions that should be
// The Same - i.e. that are outer to a horizontalisation. If a
// horizontalisation splits a slice {A,B} into {A}{B} then the right
// transitions connecting {B} to the right (and {A} to the left) should be
// more or less indistinguishable to the ones connecting {A,B} to the left
// and right. We use the information extracted from the hori edges into the
// slices to similarly mark the transitions with what other other
// transitions they represent, and whether they are "top-level" or not.
function find_equiv_transitions(slices, transitions){
  var slicedict = Object.fromEntries(slices.map((s) => [s[1],s]));
  transitions.forEach((t) => t[3] = true);
  var interesting_transitions = transitions.filter((t) =>
                                  slicedict[t[0][1]][4].length > 0 || 
				  slicedict[t[2][1]][4].length > 0 );
  for((t) of interesting_transitions){
    let lid = t[0][1];
    let rid = t[2][1];
    let equiv_transitions = [];
    for(l of [lid].concat(slicedict[lid][4])){
      for(r of [rid].concat(slicedict[rid][4])){
	 let nts = transitions.filter((t) => t[0][1] == l &&
					      t[2][1] == r );
	 if(nts.length == 0)
	   continue;
	 if(nts.length != 1)
	   console.log("Something weird is going on ", nts);
	 let nt = nts[0];
	 if(nt != t){
	   nt[3] = false;
	   equiv_transitions.push(nt);
	 }
      }
    }
    t[4] = equiv_transitions;
  }
}

// This function uses the previously annotated info in the derivation graph
// to find the (possible) origins of each note, and creates the appropriate
// relation. 
function infer_note_origins(dg, draw_context) {
  var slices = dg.dgSlices;
  var transitions = dg.dgTransitions;
  var slicedict = Object.fromEntries(slices.map((s) => [s[1],s]));
  var passingdict;
  for(s of slices.filter((s) => s[3])){
    let lts = transitions.filter((t) => t[2][1] == s[1]);
    let rts = transitions.filter((t) => t[0][1] == s[1]);
    let pts = transitions.filter((t) => lts.map((t) => t[0][1]).includes(t[0][1]) && rts.map((t) => t[2][1]).includes(t[2][1]));
    if(pts.length > 1){
      console.log("Something weird happened with the graph structure - finding more than one parent transition to this slice", s, pts);
      continue;
    }else if(pts.length == 0){
      console.debug("Found a root slice",s);
      continue;
    }
    let pt = pts[0];
    // lt/rt will be the next transition that gets split to keep
    // elaborating any nonterminal edges. 
    let lt = lts.filter((t) => (t[0][1] == pt[0][1]))[0];
    let rt = rts.filter((t) => (t[2][1] == pt[2][1]))[0];
    console.log(pt,lt,rt);
    let lps = slicedict[pt[0][1]];
    let rps = slicedict[pt[2][1]];
    let edges = pt[0][1];
    for(n of s[2]['notes-origs']){
      let [[k,v]] = Object.entries(n.orig);
      let s = rps;
      let p = [n];
      switch(k) {
	case "RootNote": continue;
	case "SingleRightRepeat":
	case "SingleRightNeighbour":
	     s = lps;
	     console.log("SingleRight");
	case "SingleLeftRepeat":
	case "SingleLeftNeighbour":
	     if(s == rps)
	       console.log("SingleLeft");
	     console.log(s);
	     let candidates = s[2]['notes-origs'].filter((n) => notes_equals(v, n.note));
	     annotate_onesided_note_origins(n, candidates, k, draw_context);
	     break;
	case "PassingLeft":
	     p[1] = lt;

	case "PassingRight":
	     p[1] = rt;
	case "PassingMid":
	     // Find the correct nonterminal edge in the parent transition
	     // And add the candidates for this note (together with the
	     // transition where the movement is continued)
	     let pnts = pt[1].edgesNT.filter((e) => edges_equals([e[0],e[1]],v));
	     pnts.forEach((pnt) => {pnt[pnt.length] = p;}); 
	     console.log("Passing motion");
	     break;
	default:
	     console.log("Double sided");
	     let [l,r] = v;
	     let lcandidates = lps[2]['notes-origs'].filter((n) => notes_equals(l, n.note));
	     let rcandidates = rps[2]['notes-origs'].filter((n) => notes_equals(r, n.note));
	     console.log(l,lcandidates,r,rcandidates, s);
	     annotate_twosided_note_origins(n, lcandidates, rcandidates, k, draw_context);
      }
    }
  }
  // Finally, we use the annotated info to also create the passing
  // relations
  annotate_passings(slices, transitions, draw_context);
}

// Given a JSON DerivationGraph as given by the Haskell protovoice model,
// and a sliced and tied draw context which matches the graph surface,
// annotate the origins of as many notes as possible
function match_to_reductive_analysis(draw_context, dgobj) {
  dgobj.dgFoot.reverse()
  measures = Array.from(draw_context.mei_score.querySelectorAll("measure"))
  match_foot(measures, dgobj.dgFoot)
  copy_foot_to_slices(dgobj.dgFoot, dgobj.dgSlices)
  propagate_slices_through_horiedges(dgobj.dgSlices, dgobj.dgHoriEdges)
  find_equiv_transitions(dgobj.dgSlices, dgobj.dgTransitions);
  infer_note_origins(dgobj, draw_context)
}



