const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  ...expoConfig,
  prettierConfig,
  {
    // Standalone Node build tooling, not app source — not RN/browser code, shouldn't be linted
    // against those globals.
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'scripts/*'],
  },
  {
    rules: {
      'import/order': 'off',
    },
  },
];
