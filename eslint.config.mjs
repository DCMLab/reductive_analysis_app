import { defineConfig, globalIgnores } from "eslint/config";
import babelParser from "@babel/eslint-parser";

export default defineConfig([globalIgnores(["src/public/**/*"]), {
    languageOptions: {
        globals: {},
        parser: babelParser,
        ecmaVersion: 12,
        sourceType: "module",

        parserOptions: {
            ecmaFeatures: {
                impliedStrict: true,
            },
        },
    },

    rules: {
        indent: [2, 2, {
            SwitchCase: 1,
        }],

        "linebreak-style": 0,

        quotes: [2, "single", {
            allowTemplateLiterals: true,
        }],

        semi: [2, "never"],
        "array-bracket-spacing": [2, "never"],
        "arrow-spacing": 2,

        "brace-style": [2, "1tbs", {
            allowSingleLine: true,
        }],

        "block-spacing": 2,
        "comma-spacing": 2,
        "computed-property-spacing": [2, "never"],
        "func-call-spacing": 2,
        "keyword-spacing": 2,

        "key-spacing": [2, {
            mode: "minimum",
        }],

        "object-curly-spacing": [2, "always"],
        "no-irregular-whitespace": 2,

        "no-multi-spaces": [2, {
            exceptions: {
                ImportDeclaration: true,
            },
        }],

        "no-multiple-empty-lines": [2, {
            max: 1,
        }],

        "no-spaced-func": 2,
        "rest-spread-spacing": [2, "never"],

        "semi-spacing": [2, {
            before: false,
            after: true,
        }],

        "space-before-blocks": 2,

        "space-before-function-paren": [0, {
            asyncArrow: "always",
        }],

        "space-in-parens": 2,
        "space-infix-ops": 2,
        "space-unary-ops": 2,

        "spaced-comment": [2, "always", {
            block: {
                balanced: true,
            },
        }],

        "template-curly-spacing": [2, "never"],
        "template-tag-spacing": [2, "always"],
    },
}]);