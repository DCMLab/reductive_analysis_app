function initialize_metadata() {
  // Runs on load, initializes the metadata div
  // Create title/composer if they don't exist
  var meiHead = mei.getElementsByTagName("meiHead")[0];
  var fd = mei.getElementsByTagName("fileDesc")[0];
  var titleStmt = fd.getElementsByTagName("titleStmt")[0];
  var title, titles = titleStmt.getElementsByTagName("title");
  if(titles.length == 0){
    title = mei.createElement("title");
    titles.appendChild(title);
  }else{
    title = titles[0];
  }
  document.getElementById("metadata_title").value = title.innerHTML;

  // Get or add composer element and set it to what's in the textfield
  var composer, resp, resps = titleStmt.getElementsByTagName("respStmt");
  if(resps.length == 0){
    let resp = mei.createElement("respStmt");
    composer = mei.createElement("persName");
    composer.setAttribute("role","composer");
    resp.appendChild(composer);
    titleStmt.appendChild(resp);
  }else{
    resp = resps[0];
    composer = resp.querySelector("[role=composer]");
  }
  document.getElementById("composer").value = composer.innerHTML;

  var analyst = resp.querySelector("[role=analyst]");
  if(analyst)
    document.getElementById("analyst").value = analyst.innerHTML;
  else{
    analyst = mei.createElement("persName");
    analyst.setAttribute("role","analyst");
    resp.appendChild(analyst);
  }
  var annotator = resp.querySelector("[role=annotator]");
  if(annotator)
    document.getElementById("annotator").value = annotator.innerHTML;
  else{
    annotator = mei.createElement("persName");
    annotator.setAttribute("role","annotator");
    resp.appendChild(annotator);
  }
}

function update_metadata() {
  //Runs after focus leaves one of the metadata text fields
  var meiHead = mei.getElementsByTagName("meiHead")[0];
  var fd = mei.getElementsByTagName("fileDesc")[0];
  var titleStmt = fd.getElementsByTagName("titleStmt")[0];
  var resps = titleStmt.getElementsByTagName("respStmt")[0];

  // Get title element and set it to what's in the textfield
  var title, titles = titleStmt.getElementsByTagName("title");
  title = titles[0];
  title.innerHTML = document.getElementById("metadata_title").value;

  // Get composer element and set it to what's in the textfield
  var composer = resps.querySelector("[role=composer]");
  composer.innerHTML = document.getElementById("composer").value;

  // Get analyst element and set it to what's in the textfield
  var analyst = resps.querySelector("[role=analyst]");
  analyst.innerHTML = document.getElementById("analyst").value;

  // Get annotator element and set it to what's in the textfield
  var annotator = resps.querySelector("[role=annotator]");
  annotator.innerHTML = document.getElementById("annotator").value;

  textoff();
}


function from_musicxml_metadata() {
  // Runs on load from MusicXML 
  var meiHead = mei.getElementsByTagName("meiHead")[0];
  var fd = mei.getElementsByTagName("fileDesc")[0];
  var encDesc,encDescs = mei.getElementsByTagName("encodingDesc");
  if(encDescs.length == 0){
    encDesc = mei.createElement("encodingDesc");
    meiHead.insertBefore(encDesc, fd.nextSibling);
  }else
    endDesc = encDescs[0];
}

function from_mei_metadata() {
  // Runs on load from MEI not previously touched by the app
}

function assign_responsibility_selected(resp) {
  // Loops through the selected (SVG) relations and notes and assigns @resp
  // to the argument xml:id
  // Make this undoable
}

function remove_responsibility() {
  // Loops through the selected (SVG) relations and notes, removing
  // responsibility annotations
  // Make this undoable
}


function add_responsible() {
  // Add textfields and buttons for another responsible person
  // Make this undoable
}

function delete_responsible() {
  // Remove a responsible person
  // Traverse all the nodes looking for attributes where this is the
  // responsible person and remove them
  // Make this an undoable action
}





