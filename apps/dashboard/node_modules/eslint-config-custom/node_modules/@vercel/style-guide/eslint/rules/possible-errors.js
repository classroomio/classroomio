module.exports = {
  rules: {
    /**
     * Disallow await inside of loops.
     *
     * 🚫 Not fixable - https://eslint.org/docs/rules/no-await-in-loop
     */
    'no-await-in-loop': 'error',
    /**
     * Disallow the use of console.
     *
     * 🚫 Not fixable - https://eslint.org/docs/rules/no-console
     */
    'no-console': 'error',
    /**
     * Disallow expressions where the operation doesn't affect the value.
     *
     * 🚫 Not fixable - https://eslint.org/docs/rules/no-console
     */
    'no-constant-binary-expression': 'error',
    /**
     * Disallow returning values from Promise executor functions.
     *
     * 🚫 Not fixable - https://eslint.org/docs/rules/no-promise-executor-return
     */
    'no-promise-executor-return': 'error',
    /**
     * Disallow template literal placeholder syntax in regular strings, as
     * these are likely errors.
     *
     * 🚫 Not fixable - https://eslint.org/docs/rules/no-template-curly-in-string
     */
    'no-template-curly-in-string': 'error',
    /**
     *  Disallow loops with a body that allows only one iteration.
     *
     * 🚫 Not fixable - https://eslint.org/docs/rules/no-unreachable-loop
     */
    'no-unreachable-loop': 'error',
  },
};
