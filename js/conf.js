var shades_array = d3.schemeTableau10;

var type_keys = {};

var type_shades = {};

var meta_keys = {};

var meta_shades = {};

var button_shades = {};

var meta_conf = {
"context"      :{key: "c", colour: 0},
"layer"     :{key: "l", colour: 6},
"phrase"   :{key: "r", colour: 2}, 
"section"    :{key: "t", colour: 3}, 
}

var type_conf = {
"repeat"      :{key: "e", colour: 0},
"passing"     :{key: "p", colour: 6},
"neighbour"   :{key: "n", colour: 2}, 
"harmonic"    :{key: "i", colour: 3}, 
"arpeggio"    :{key: "a", colour: 4}, 
"urlinie"     :{key: "u", colour: 5}, 
"bassbrechung":{key: "b", colour: 5} 
}

var type_synonym = {
  "prolongation" : "passing",
  "arp" : "arpeggio",
  "bassbrech" : "bassbrechung"
}




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
