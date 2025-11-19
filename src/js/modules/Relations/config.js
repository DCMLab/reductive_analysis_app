/**
 * The order in which the groups of relations are presented in the relations
 * menu for a given selection type.
 */
const menuOrderByType = {
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
  // To view or add color codes, see __colors.scss.
  main: {
    arpeggiation: { key: 'a', color: 1 },
    harmonic:     { key: 'i', color: 2 },
    neighbor:     { key: 'n', color: 3 },
    passing:      { key: 'p', color: 4 },
    repetition:   { key: 't', color: 5 },
    untyped:      { key: 'y', color: 6 },
  },

  // The full list of pre-defined relations.
  // Should sufficiently represent the analytical technique(s) at hand.
  // These values will populate the relations drop-down menu.
  additional: [
    '5_6_shift',
    'added_root',
    'arpeggiated_ascent',
    'back_relating_dominant',
    'bassbrechung_component',
    'coupling',
    'displacement',
    'initial_ascent',
    'mixture',
    'phrygian_ii',
    'register_transfer',
    'urlinie',
    'urlinie_transference',
    'voice_exchange_component',
    'voice_exchange_component_chromaticized',
  ]
}

// Meta-relation types and shortcuts.
export const metaRelationTypes = {
  name: 'metarelation',

  // Main relation types, keyboards shortcuts and colors.
  main: {
    linear_progression: { key: 'l', color: 1 },
    motive:   { key: 'm', color: 2 },
    phrase:   { key: 'r', color: 3 },
    section:  { key: 'o', color: 4 },
  },

  // The full list of pre-defined meta-relations.
  // Should sufficiently represent the analytical technique(s) at hand.
  // These labels will populate the meta-relations drop-down menu.
  additional: [
    'auxiliary_cadence',
    'bassbrechung',
    'bassbrechung_transference',
    'contradiction',
    'indeterminacy',
    'interruption',
    'interruption_branch_1',
    'interruption_branch_2',
    'linear_intervallic_progression',
    'linear_intervallic_progression_module',
    'motion_from_the_inner_voice',
    'motion_into_the_inner_voice',
    'motive',
    'parallel_fifths',
    'parallel_octaves',
    'reaching_over',
    'superposition',
    'unfolding',
    'urlinie',
    'ursatz',
    'ursatz_transference',
    'voice_exchange',
  ],
}

// Composite (“combo”) relation types and shortcuts.
export const comboRelationTypes = {
  name: 'composite relation',

  main: {
    'hierarchical_arpeggiation': { key: 'P', total: 'passing', outer: 'arpeggiation' },
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
