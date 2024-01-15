/**
 * These are enabled by `jsx-a11y/recommended`, but we've made the decision to
 * disable them.
 */
const disabledRules = {
  // This rule has been deprecated, but not yet removed.
  'jsx-a11y/no-onchange': 'off',
};

module.exports = {
  rules: {
    ...disabledRules,
  },
};
