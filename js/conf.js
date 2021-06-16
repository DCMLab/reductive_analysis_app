try {
  var shades_array = d3.schemeTableau10;

  var type_keys = {};

  var type_shades = {};

  var meta_keys = {};

  var meta_shades = {};

  var combo_keys = {};

  var button_shades = {};

  // General action shortcuts.
  var action_conf = {
    "undo":                    "U",
    "deselect_all":            "d",
    "delete_all":              "D",
    "add_bookmark":            "^",
    "move_relation_to_front":  "z",
    "reduce_relations":        "r",
    "show_hide_notation":      "s",
    "toggle_type_shades":      "h",
    "select_same_notes":       "+",
    "toggle_add_note":         "x"
  }

  // Navigation shortcuts.
  var navigation_conf = {
    "pan_left":                   "[",
    "pan_right":                  "]",
    "jump_to_next_bookmark":      "{",
    "jump_to_previous_bookmark":  "}",
    "jump_to_context_below":      ",",
    "jump_to_context_above":      ".",
    "toggle_palette":             "-"
  }

  // Custon (meta-)relation shortcuts.
  custom_conf = {
    "relation":            "R",
    "meta_relation":       "M"
  }

  // Meta-relation types and shortcuts.
  var meta_conf = {
  "context"      :{key: "c", colour: 0},
  "layer"     :{key: "l", colour: 6},
  "phrase"   :{key: "r", colour: 2},
  "section"    :{key: "t", colour: 3},
  }

  // Relation types and shortcuts.
  var type_conf = {
  "repeat"      :{key: "e", colour: 0},
  "passing"     :{key: "p", colour: 6},
  "neighbour"   :{key: "n", colour: 2},
  "harmonic"    :{key: "i", colour: 3},
  "arpeggio"    :{key: "a", colour: 4},
  "urlinie"     :{key: "u", colour: 5}, 
  "bassbrechung":{key: "b", colour: 5} 
  }

  // Composite ("combo") relation types and shortcuts.
  var combo_conf = {
    "passing_comb" : {key: "P", total: "passing", outer: "arpeggio"},
    "neighbour_comb" : {key: "N", total: "neighbour", outer: "repeat"},
  }


  var type_synonym = {
    "prolongation" : "passing",
    "arp" : "arpeggio",
    "bassbrech" : "bassbrechung"
  }


  // Authorship meta-data fields.
  var optional_resp_roles = [
    "analyst", "annotator"
  ]



  // MEI classes not to be rendered.
  var hide_classes = [
    "fermata",
    "rest",
    "stem",
    "flag",
    "tie",
    "artic",
    "slur",
    "dynam",
    "tempo",
    "tupletNum",
    "dir"
  ]

  // THIS MUST STAY AT THE END OF THE try {...} SCOPE.
  var CONFIG_OK = true;

} catch (error) {

  var CONFIG_OK = false;

  console.log('[Reductive Analysis App] Error loading configuration file (', e, ')');
  console.log('[Reductive Analysis App] Attempting to proceed nonetheless, but expect malfunction.');
  alert('Error loading configuration file (', e, ').\nAttempting to proceed nonetheless, but expect malfunction.');

}
