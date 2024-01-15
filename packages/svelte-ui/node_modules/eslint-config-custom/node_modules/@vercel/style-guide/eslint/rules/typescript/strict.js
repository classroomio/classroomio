const disabledRules = {
  // This is disabled as we feel that checking empty strings is a valid use
  // of `||` over `??`. We'll track this related issue:
  // https://github.com/typescript-eslint/typescript-eslint/issues/4906
  '@typescript-eslint/prefer-nullish-coalescing': 'off',
};

module.exports = {
  rules: {
    ...disabledRules,
  },
};
