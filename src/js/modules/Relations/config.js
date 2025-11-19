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
  main: {
    arpeggiation:     { key: 'a', color: 5, shadeColor: 4, },
    harmonic:     { key: 'i', color: 4, shadeColor: 3, },
    neighbor:    { key: 'n', color: 3, shadeColor: 2, },
    passing:      { key: 'p', color: 2, shadeColor: 6, },
    repetition:       { key: 'e', color: 1, shadeColor: 0, },
    untyped:      { color: 5 },
  },

  // The full list of pre-defined relations.
  // Should sufficiently represent the analytical technique(s) at hand.
  // These values will populate the relations drop-down menu.
  additional: [
    '56_shift',
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
    linear_progression: { key: 'l', color: 1, shadeColor: 6 },
    motive:   { key: 'm', color: 4, shadeColor: 5 },
    phrase:   { key: 'r', color: 3, shadeColor: 2 },
    section:  { key: 't', color: 5, shadeColor: 3 },
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
