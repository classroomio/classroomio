const { TYPESCRIPT_FILES } = require('./constants');

module.exports = {
  extends: ['plugin:jest/recommended', require.resolve('./rules/jest')],
  overrides: [
    // Prefer the Jest version of this rule. This silently fails when type
    // information is not available.
    {
      files: TYPESCRIPT_FILES,
      rules: {
        '@typescript-eslint/unbound-method': 'off',
        'jest/unbound-method': 'error',
      },
    },
  ],
};
