import globals from 'globals'
import eslintJs from '@eslint/js'

const rules = {
  ...eslintJs.configs.recommended.rules,
  'no-unused-vars': 'warn',
  'no-unreachable': 'warn',
}

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    files: ['vite.config.js', 'vite/**/*.js'],
    languageOptions: {
      globals: { ...globals.node },
      ecmaVersion: 2021,
      sourceType: 'module', // Ensure ES module imports
    },
    rules,
  },
  {
    files: ['js/**/*.js'],
    languageOptions: {
      globals: { ...globals.browser },
      ecmaVersion: 2021,
      sourceType: 'module', // Ensure ES module imports
    },
    rules,
    settings: {
      'import/resolver': {
        alias: {
          map: [['@', '.']],
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
  },
]
