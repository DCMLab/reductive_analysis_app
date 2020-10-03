var type_keys = {
  "e": "repeat",
  "p": "passing",
  "n": "neighbour",
  "i": "harmonic",
  "a": "arpeggio",
  "u": "urlinie",
  "b": "bassbrechung"
}

var shades_array = d3.schemeTableau10;

var type_shades = {
  "repeat" : shades_array[0],
  "prolongation" :shades_array[0],
  "passing" :shades_array[6],
  "neighbour" : shades_array[2],
  "harmonic" :shades_array[3],
  "arpeggio" : shades_array[4],
  "arp" : shades_array[4],
  "urlinie" : shades_array[5],
  "bassbrechung" : shades_array[5],
  "bassbrech" : shades_array[5],
};

var button_shades = {
"repeathyperedgebutton" :shades_array[0],
"passinghyperedgebutton": shades_array[6],
"neighbourhyperedgebutton": shades_array[2],
"harmonichyperedgebutton": shades_array[3],
"arpeggiohyperedgebutton": shades_array[4],
"urliniehyperedgebutton": shades_array[5],
"bassbrechunghyperedgebutton" : shades_array[5],
};

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
