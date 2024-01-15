module.exports = {
  rules: {
    /**
     * Disallow non-import statements appearing before import statements.
     *
     * 🚫 Not fixable - https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/first.md
     */
    'import/first': 'error',
    /**
     * Require a newline after the last import/require.
     *
     * 🔧 Fixable - https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/newline-after-import.md
     */
    'import/newline-after-import': 'warn',
    /**
     * Disallow import of modules using absolute paths.
     *
     * 🚫 Not fixable - https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-absolute-path.md
     */
    'import/no-absolute-path': 'error',
    /**
     * Disallow cyclical dependencies between modules.
     *
     * 🚫 Not fixable - https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-cycle.md
     */
    'import/no-cycle': 'error',
    /**
     * Disallow default exports.
     *
     * 🚫 Not fixable - https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-default-export.md
     */
    'import/no-default-export': 'error',
    /**
     * Disallow the use of extraneous packages.
     *
     * 🚫 Not fixable - https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-extraneous-dependencies.md
     */
    'import/no-extraneous-dependencies': ['error', { includeTypes: true }],
    /**
     * Disallow mutable exports.
     *
     * 🚫 Not fixable - https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-mutable-exports.md
     */
    'import/no-mutable-exports': 'error',
    /**
     * Disallow importing packages through relative paths.
     *
     * 🚫 Not fixable - https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-relative-packages.md
     */
    'import/no-relative-packages': 'warn',
    /**
     * Disallow a module from importing itself.
     *
     * 🚫 Not fixable - https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-self-import.md
     */
    'import/no-self-import': 'error',
    /**
     * Ensures that there are no useless path segments.
     *
     * 🚫 Not fixable - https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-useless-path-segments.md
     */
    'import/no-useless-path-segments': ['error'],
    /**
     * Enforce a module import order convention.
     *
     * 🔧 Fixable - https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/order.md
     */
    'import/order': [
      'warn',
      {
        groups: [
          'builtin', // Node.js built-in modules
          'external', // Packages
          'internal', // Aliased modules
          'parent', // Relative parent
          'sibling', // Relative sibling
          'index', // Relative index
        ],
        'newlines-between': 'never',
      },
    ],
  },
};
