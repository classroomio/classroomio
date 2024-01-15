const { TYPESCRIPT_FILES } = require('./constants');
const requirePackage = require('./utils/require-package');

requirePackage('typescript', 'typescript');

module.exports = {
  overrides: [
    {
      files: TYPESCRIPT_FILES,
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-type-checked',
        'plugin:@typescript-eslint/strict',
        'plugin:@typescript-eslint/strict-type-checked',
        'plugin:@typescript-eslint/stylistic',
        'plugin:@typescript-eslint/stylistic-type-checked',
        'plugin:import/typescript',
        'prettier',
        require.resolve('./rules/typescript'),
        require.resolve('./rules/typescript/extension'),
        require.resolve('./rules/typescript/import'),
        require.resolve('./rules/typescript/strict'),
        require.resolve('./rules/tsdoc'),
      ],
    },
  ],
};
