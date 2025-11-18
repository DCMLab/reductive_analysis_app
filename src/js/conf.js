/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/
export const type_keys = {}
export const type_shades = {}
export const meta_keys = {}
export const meta_shades = {}
export const combo_keys = {}
export const button_shades = {}

// General action shortcuts.
export const action_conf = {
  undo: 'U',
  redo: 'I',
  deselect_all: 'd',
  delete_all: 'D',
  add_bookmark: 'B',
  move_relation_to_front: 'z',
  reduce_relations: 'r',
  naturalize_note: 'Z',
  copy: 'C',
  paste: 'V',
  toggle_metarelations: 'm',
}

// Navigation shortcuts.
export const navigation_conf = {
  pan_left: '[',
  pan_right: ']',
  jump_to_next_bookmark: '{',
  jump_to_previous_bookmark: '}',
  jump_to_context_below: ',', // next layer
  jump_to_context_above: '.', // previous layer
  switch_context_on_hover: false,
}

// MEI classes with togglable visibility.
export const hide_classes = [
  'artic',
  'barLine',
  'dir',
  'dots',
  'dynam',
  'fermata',
  'flag',
  'hairpin',
  'meterSig',
  'mRest',
  'rest',
  'slur',
  'stem',
  'tie',
  'trill',
  'turn',
  'tupletNum',
  'verse',
]

// MEI and MusicXML tags to be stripped before rendering.
export const strip_mei_tags = [
  'dir',
  'label',
  'labelAbbr',
  'tempo',
  'text',
]

export const strip_xml_tags = []

// Trap (true) or ignore (false) runtime errors.
export const debug = false

export const CONFIG_OK = true
