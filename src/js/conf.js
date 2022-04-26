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
  'undo':                    'U',
  'redo':                    'I',
  'deselect_all':            'd',
  'delete_all':              'D',
  'add_bookmark':            '^',
  'move_relation_to_front':  'z',
  'reduce_relations':        'r',
  // 'show_hide_notation':      's',
  // 'toggle_type_shades':      'h',
  'select_same_notes':       '+',
  // 'toggle_add_note':         'x',
  'naturalize_note':         'Z',
  'copy':                    'C',
  'paste':                   'V'
}

// Navigation shortcuts.
export const navigation_conf = {
  'pan_left':                   '[',
  'pan_right':                  ']',
  'jump_to_next_bookmark':      '{',
  'jump_to_previous_bookmark':  '}',
  'jump_to_context_below':      ',',
  'jump_to_context_above':      '.',
  'toggle_palette':             '-',
  // 'zoom_out':                   '(',
  // 'zoom_in':                    ')',
  'switch_context_on_hover':    false
}

// Custon (meta-)relation shortcuts.
export const custom_conf = {
  'relation':            'R',
  'meta_relation':       'M'
}

// Meta-relation types and shortcuts.
export const meta_conf = {
  'context': { key: 'c', colour: 0 },
  'layer': { key: 'l', colour: 6 },
  'phrase': { key: 'r', colour: 2 },
  'section': { key: 't', colour: 3 },
}

// Relation types and shortcuts.
export const type_conf = {
  'repeat': { key: 'e', colour: 0 },
  'passing': { key: 'p', colour: 6 },
  'neighbour': { key: 'n', colour: 2 },
  'harmonic': { key: 'i', colour: 3 },
  'arpeggio': { key: 'a', colour: 4 },
  'urlinie': { key: 'u', colour: 5 },
  'bassbrechung': { key: 'b', colour: 5 }
}

// Composite ("combo") relation types and shortcuts.
export const combo_conf = {
  'passing_comb': { key: 'P', total: 'passing', outer: 'arpeggio' },
  'neighbour_comb': { key: 'N', total: 'neighbour', outer: 'repeat' },
}

export const type_synonym = {
  'prolongation': 'passing',
  'arp': 'arpeggio',
  'bassbrech': 'bassbrechung'
}

// The full list of pre-defined relations.
// Should sufficiently represent the analytical technique(s) at hand.
// These values will populate the relations drop-down menu.
export const type_full_conf = [
  'neighbour',
  'repetition',
  'arpeggiation',
  'passing',
  'back_relating_dominant',
  'displacement',
  'register_transfer',
  '56_shift',
  'added_root',
  'initial_ascent',
  'arpeggiated_ascent',
  'urlinie',
  'urlinie_transference',
  'bassbrechung_component',
  'coupling',
  'voice_exchange_component',
  'voice_exchange_component_chromaticized',
  'mixture',
  'phrygian_ii'
]

// The full list of pre-defined meta-relations.
// Should sufficiently represent the analytical technique(s) at hand.
// These labels will populate the meta-relations drop-down menu.
export const meta_full_conf = [
  'auxiliary_cadence',
  'superposition',
  'reaching_over',
  'urlinie_meta',
  'ursatz',
  'bassbrechung',
  'bassbrechung_transference',
  'ursatz_transference',
  'unfolding',
  'motion_into_the_inner_voice',
  'motion_from_the_inner_voice',
  'linear_intervallic_progression',
  'linear_intervallic_progression_module',
  'interruption',
  'interruption_branch_1',
  'interruption_branch_2',
  'voice_exchange',
  'motivic_parallelism',
  'motive',
  'contradiction',
  'indeterminacy',
  'parallel_fifths',
  'parallel_octaves'
]

// MEI classes to be hidden after rendering.
export const hide_classes = [
  'barLineAttr',
  'fermata',
  'rest',
  'stem',
  'flag',
  'tie',
  'artic',
  'slur',
  'dynam',
  'tempo',
  'tupletNum',
  'dir',
  'verse'
]

// MEI and MusicXML tags to be stripped before rendering.
export const strip_mei_tags = [
  'label',
  'labelAbbr',
  'tempo'
]

export const strip_xml_tags = [
]

// THIS MUST STAY AT THE END OF THE try {...} SCOPE.
export const CONFIG_OK = true

// } catch (error) {

//   export const CONFIG_OK = false

//   console.log('[Reductive Analysis App] Error loading configuration file (', e, ')')
//   console.log('[Reductive Analysis App] Attempting to proceed nonetheless, but expect malfunction.')
//   alert('Error loading configuration file (', e, ').\nAttempting to proceed nonetheless, but expect malfunction.')

// }
