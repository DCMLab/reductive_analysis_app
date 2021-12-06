/**
 * The order in which the groups of relations are presented in the relations
 * menu for a given selection type.
 */
export const menuOrderByType = {
  note: [
    'relations',
    'metarelations',
    'comborelations',
  ],
  relation: [
    'metarelations',
    'relations',
    'comborelations',
  ],
  metarelation: [
    'metarelations',
    'comborelations',
    'relations',
  ],
}

export const relationTypes = {
  name: 'relation',

  // Main relation types, keyboards shortcuts and colors.
  main: {
    repeat:       { key: 'e', color: 1 },
    passing:      { key: 'p', color: 2 },
    neighbour:    { key: 'n', color: 3 },
    harmonic:     { key: 'i', color: 4 },
    arpeggio:     { key: 'a', color: 5 },
    urlinie:      { key: 'u', color: 6 },
    bassbrechung: { key: 'b', color: 7 },
    untyped:      { color: 5 },
  },

  // The full list of pre-defined relations.
  // Should sufficiently represent the analytical technique(s) at hand.
  // These values will populate the relations drop-down menu.
  additional: [
    // 'neighbour', // isn’t it a duplicate of `relationTypes.main.neighbour`?
    'repetition',
    'arpeggiation',
    // 'passing', // isn’t it a duplicate of `relationTypes.main.neighbour`?
    'back_relating_dominant',
    'displacement',
    'register_transfer',
    '56_shift',
    'added_root',
    'initial_ascent',
    'arpeggiated_ascent',
    // 'urlinie', // isn’t it a duplicate of `relationTypes.main.neighbour`?
    'urlinie_transference',
    'bassbrechung_component',
    'coupling',
    'voice_exchange_component',
    'voice_exchange_component_chromaticized',
    'mixture',
    'phrygian_ii'
  ]
}

// Meta-relation types and shortcuts.
export const metaRelationTypes = {
  name: 'metarelation',

  // Main relation types, keyboards shortcuts and colors.
  main: {
    context:  { key: 'c', color: 0 },
    layer:    { key: 'l', color: 6 },
    phrase:   { key: 'r', color: 2 },
    section:  { key: 't', color: 3 },
  },

  // The full list of pre-defined meta-relations.
  // Should sufficiently represent the analytical technique(s) at hand.
  // These labels will populate the meta-relations drop-down menu.
  additional: [
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
  ],
}

// Composite (“combo”) relation types and shortcuts.
export const comboRelationTypes = {
  name: 'comborelation',

  main: {
    'passing comborelation': { key: 'P', total: 'passing', outer: 'arpeggio' },
    'neighbour comborelation': { key: 'N', total: 'neighbour', outer: 'repeat' },
  }
}

// Custon (meta-)relation shortcuts.
export const custom_conf = {
  'relation':            'R',
  'meta_relation':       'M'
}

/**
 * Get the relations menu order for the provided selection type.
 *
 * @param {string} type Selection type
 * @returns {Array}
 */
export const getMenuOrder = type => menuOrderByType[type]
