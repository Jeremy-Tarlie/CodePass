'use strict';

const pluginSecurity = require('eslint-plugin-security');
const tsParser = require('@typescript-eslint/parser');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  {
    ignores: ['**/dist/**', '**/dist-electron/**', '**/node_modules/**', '**/electron/**'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    ...pluginSecurity.configs.recommended,
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
  },
];
