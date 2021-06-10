function initialize_metadata() {
  // Runs on load, initializes the metadata div
  // Create title/composer if they don't exist
  var meiHead = mei.getElementsByTagName("meiHead")[0];
  var fd = mei.getElementsByTagName("fileDesc")[0];
  var titleStmt = fd.getElementsByTagName("titleStmt")[0];
  var title, titles = titleStmt.getElementsByTagName("title");
  if(titles.length == 0){
    title = mei.createElement("title");
    titles[0] = title;
  }else{
    title = titles[0];
  }
  document.getElementById("metadata_title").value = title.innerHTML;

  // Get or add composer element and set it to what's in the textfield
  // TODO: Try more places in the MEI
  var composer, resp, resps = titleStmt.getElementsByTagName("respStmt");
  if(resps.length == 0){
    resp = mei.createElement("respStmt");
    titleStmt.appendChild(resp);
  }else{
    resp = resps[0];
  }
  if(resp.querySelector("[role=composer]"))
    composer = resp.querySelector("[role=composer]");
  else{
    composer = mei.createElement("persName");
    composer.setAttribute("role","composer");
    composer.setAttribute("xml:id","composer");
    resp.appendChild(composer);
  }

  document.getElementById("composer").value = composer.innerHTML;

  var optionals = document.getElementById("optional_metadata_input");
  optionals.innerHTML="";

  var roles = resp.querySelectorAll("[role]");
  var conf_roles = optional_resp_roles;

  for(role of roles) {
    var role_str = role.getAttribute("role");
    if(role_str == "composer")
      continue;
    add_resp_person_input(role.getAttribute("role"),role.getAttribute("xml:id"),role.innerHTML);
    // No need to add the same role twice
    conf_roles = conf_roles.filter((s) => s != role_str);
  }
  for(role of conf_roles) {
    mei_role = mei.createElement("persName");
    mei_role.setAttribute("role",role);
    mei_role.setAttribute("xml:id",role);
    resp.appendChild(mei_role);
    add_resp_person_input(role);
  }



}

function metadata_textinput(role, id){
  var input = document.createElement("input");
  input.setAttribute("type","text");
  input.setAttribute("id",id);
  input.onfocus = texton;
  input.onblur = update_metadata;
  return input;
}

function metadata_respassign(role,id) {
  var input = document.createElement("input");
  input.setAttribute("type","button");
  input.setAttribute("id",role+"_respassign");
  input.setAttribute("value","Assign responsibility");
  input.onclick = () => {assign_responsibility_selected(id);};
  return input;
}


function add_resp_person_input(role,id="",value=""){
  if(!id)
    id = role;
  var div = document.getElementById("optional_metadata_input");
  div.append(capitalize(role)+": ");
  var ti = metadata_textinput(role, id);
  ti.value = value;
  div.appendChild(ti);
  div.append(metadata_respassign(role,id));
  div.appendChild(document.createElement("br"));
  
}


function update_metadata() {
  //Runs after focus leaves one of the metadata text fields
  var meiHead = mei.getElementsByTagName("meiHead")[0];
  var fd = mei.getElementsByTagName("fileDesc")[0];
  var titleStmt = fd.getElementsByTagName("titleStmt")[0];
  var resp = titleStmt.getElementsByTagName("respStmt")[0];

  // Get title element and set it to what's in the textfield
  var title, titles = titleStmt.getElementsByTagName("title");
  title = titles[0];
  title.innerHTML = document.getElementById("metadata_title").value;

  // Get composer element and set it to what's in the textfield
  var composer = resp.querySelector("[role=composer]");
  composer.innerHTML = document.getElementById("composer").value;

  var optionals =
    document.getElementById("optional_metadata_input").querySelectorAll("[type=text]");

  for(optional of optionals){
    var mei_elem = get_by_id(mei,optional.id);
    mei_elem.innerHTML = optional.value;
  }


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
  var sel = selected.concat(extraselected);
  if(sel.length == 0)
    return;
  for(elem of sel){
    let mei_id = get_id(elem);
    let mei_elem = get_by_id(mei,mei_id);
    if(mei_elem.tagName == "note"){
      mei_elem.setAttribute("resp",resp);
    }else{// Assume relation or metarelation
      let lbl = mei_elem.querySelector("label");
      lbl.setAttribute("resp",resp);
    }
  }
  

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





