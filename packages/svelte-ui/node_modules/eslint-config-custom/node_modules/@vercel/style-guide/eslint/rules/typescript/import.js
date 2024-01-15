/**
 * These are enabled by `import/recommended`, but are better handled by
 * TypeScript and @typescript-eslint.
 */
const disabledRules = {
  'import/default': 'off',
  'import/export': 'off',
  'import/namespace': 'off',
  'import/no-unresolved': 'off',
};

module.exports = {
  rules: {
    ...disabledRules,
  },
};
