// This is code relating to the addition of new layers in analyses.

// Each layer is represented by a <score> element in the MEI - the
// surface being the first, and each subsequent layer making up a separate
// <score> element. Notes that reoccur in analysed layers from the surface
// should be connected using @copyof attributes, while the <score> elements
// could use @sameas to indicate that they represent the same pieces of
// music, just under different levels of abstraction.

function layer_clone_element(changes, elem, new_children) {
  // No need to copy over empty beams and measures.
  if((elem.tagName == "beam" || elem.tagName == "measure") &&
      new_children.findIndex((e) => e.tagName == "note" || 
	                            e.getElementsByTagName("note").length > 0
			    ) == -1)
    return null;
  var new_elem = elem.cloneNode();
  if(changes){
    new_elem.setAttribute("corresp", elem.getAttribute("xml:id"));
  }else{
    new_elem.setAttribute("copyof", elem.getAttribute("xml:id"));
  }
  new_children.forEach((e) => new_elem.appendChild(e));
  return new_elem;
}

function layerify(draw_context, elem) {
  var svg_elem = document.getElementById(id_in_svg(draw_context,get_id(elem)));
  if(elem.tagName == "note" && (!svg_elem || svg_elem.classList.contains("hidden"))) // This elem has been reduced away
    return [note_to_space(mei,elem), true]; //It may be that we should replace it with a space instead
  var results = Array.from(elem.children).map((e) => layerify(draw_context, e));
  var new_children = results.map((p) => p[0]).filter((x) => x != null);
  var changes = (new_children.length != elem.children.length) || // Something directly below was reduced
                 results.find((p) => p[1]) != undefined // Something further down changed
  return [layer_clone_element(changes,elem,new_children), changes];
}


function new_layer(draw_context = draw_contexts[0]) {
  var score_elem = draw_context.mei_score;
  var [new_score_elem,changed] = layerify(draw_context, score_elem);
  var n_layers = score_elem.parentElement.getElementsByTagName("score").length;
  var prefix = n_layers+"-"; //TODO: better prefix computation
                             //The - is there to not clash with view
			     //prefixes

  prefix_ids(new_score_elem,prefix); // Compute a better prefix
  // Insert after the previous
  score_elem.parentNode.insertBefore(new_score_elem, score_elem.nextSibling);
  // The basic algorithm is to take the last score element (if we're doing
  // a linear order of layers, otherwise we need the score element to build
  // off of to be given as an argument), to clone it using cloneNode(), and
  // then to do a preorder traversal of the tree, and for each element
  // do the following pseudocode:
  //
  // FUNCTION LAYERIFY // This function takes a node in the score and
  //                   // returns NULL if it has been reduced, unchanged if
  //                   // it has no ID, and with a new ID and either
  //                   // @sameas or @copyof depending on if the subtree
  //                   // includes reduced nodes or not.
  // IF this node has been reduced THEN
  //   RETURN (NULL, T)
  // LET (new_children, changed) = UNZIP MAP LAYERIFY ONTO children
  // IF REDUCE changed WITH OR and F
  //   RETURN (link_with_sameas(this).with_children(new_children), T)
  // ELSE
  //   RETURN (link_with_copyof(this).with_children(new_children), F)
  //
  // After which we fit the modified tree with a new ID prefix (built as a
  // tree address in preparation of hierarchical layer arrangements) and
  // attach it as a sibling to the previous score element, and potentially
  // modify the scoreDef appropriately.
  return new_score_elem;
}


function mei_for_layer(mei, score_elem) {
  if(!mei.contains(score_elem)){
    console.log("Score element not in MEI, aborting");
    return null;
  }
  var new_mei = clone_mei(mei);
  var our_score;
  if(!score_elem.hasAttribute("xml:id"))
    our_score = new_mei.getElementsByTagName("score")[0];
  else
    our_score= get_by_id(new_mei, score_elem.getAttribute("xml:id"));
  var paren = our_score.parentElement;
  for(let score of Array.from(paren.getElementsByTagName("score"))){
    if(score === our_score) 
      continue;
    else
      paren.removeChild(score);
  }
  return new_mei;
}


// PLANS 2021-03-09
// layerify now works as expected, making sameas/copyof connections when
// appropriate. What's next? One possible feature is to remove elements
// (measures, beams) with no notes in them. Beams in particular need
// removing as Verovio chokes otherwise. Another possible feature is to
// replace the note with a rest to make sure that they get the proper
// horizontal alignment.

// These are all useful features, but first is making a proper new layer
// This requires:
//  * Prefix-modifying the new tree, including determining the prefix
//  * Updating the rendering code to get Verovio to render some specific
//    layer.
//  * Updating adressing to make sure that a) new relations use the
//    shallowest possible entity of which the current is sameas/copyof
//  *  



