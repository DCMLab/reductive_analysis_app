const postcssPresetEnv = require('postcss-preset-env')
const postcssSafeArea = require('postcss-safe-area')
const postcssShortSize = require('postcss-short-size')

/**
 * Experimental plugin the CSS `:has` pseudo-selector. It requires to run the
 * following on the browser side:
 *
 * ```js
 * import cssHasPseudo from '@csstools/css-has-pseudo-experimental/browser'
 * cssHasPseudo(document)
 * ```
 *
 * - https://developer.mozilla.org/en-US/docs/Web/CSS/:has
 * - https://github.com/csstools/postcss-plugins/tree/main/experimental
 */
const cssHasPseudoExperimental = require('@csstools/css-has-pseudo-experimental')
const cssNano = require('cssnano')

const postcssPresetEnvOptions = {
  stage: 0,
  features: {
    // https://github.com/csstools/postcss-plugins/blob/main/plugin-packs/postcss-preset-env/src/plugins/plugins-by-id.mjs
    'all-property': false,
    'color-functional-notation': false,
    'focus-within-pseudo-class': false,
    'focus-visible-pseudo-class': false,
    'logical-properties-and-values': { dir: 'ltr' },
    'prefers-color-scheme-query': false,
    'has-pseudo-class': false, // defect, experimental version used instead
  },
}

const cssNanoOptions = { preset: ['default', { colormin: false }] }

module.exports = ({ options, env }) => ({
  plugins: [
    postcssShortSize(),
    postcssSafeArea(),
    postcssPresetEnv(postcssPresetEnvOptions),
    cssHasPseudoExperimental(),
    env === 'production' ? cssNano(cssNanoOptions) : false,
  ],
})
