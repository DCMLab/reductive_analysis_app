const postcssPresetEnv = require('postcss-preset-env');
const postcssSafeArea = require('postcss-safe-area');
const postcssShortSize = require('postcss-short-size');
const cssNano = require('cssnano');

const postcssPresetEnvOptions = {
  stage: 0,
  features: {
    // https://github.com/csstools/postcss-preset-env/blob/master/src/lib/plugins-by-id.js
    'all-property': false,
    'color-functional-notation': false,
    'focus-within-pseudo-class': false,
    'logical-properties-and-values': { dir: 'ltr' },
    'prefers-color-scheme-query': false,
  },
}

const cssNanoOptions = { preset: ['default', { colormin: false }] }

module.exports = ({ options, env }) => ({
  plugins: [
    postcssShortSize(),
    postcssSafeArea(),
    postcssPresetEnv(postcssPresetEnvOptions),
    env === 'production' ? cssNano(cssNanoOptions) : false,
  ],
})
