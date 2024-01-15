module.exports = {
  rules: {
    /**
     * Disallow useless computed property keys.
     *
     * 🔧 Fixable - https://eslint.org/docs/rules/no-useless-computed-key
     */
    'no-useless-computed-key': 'warn',
    /**
     * Disallow renaming import, export, and destructured assignments to the
     * same name.
     *
     * 🔧 Fixable - https://eslint.org/docs/rules/no-useless-rename
     */
    'no-useless-rename': 'warn',
    /**
     * Require `let` or `const` instead of `var`.
     *
     * 🔧 Fixable - https://eslint.org/docs/rules/no-var
     */
    'no-var': 'error',
    /**
     * Require object literal shorthand syntax.
     *
     * 🔧 Fixable - https://eslint.org/docs/rules/object-shorthand
     */
    'object-shorthand': 'warn',
    /**
     * Require default to `const` instead of `let`.
     *
     * 🔧 Fixable - https://eslint.org/docs/rules/prefer-const
     */
    'prefer-const': 'warn',
    /**
     * Disallow parseInt() in favor of binary, octal, and hexadecimal literals.
     *
     * 🔧 Fixable - https://eslint.org/docs/rules/prefer-numeric-literals
     */
    'prefer-numeric-literals': 'error',
    /**
     * Require using rest parameters instead of `arguments`.
     *
     * 🚫 Not fixable - https://eslint.org/docs/rules/prefer-rest-params
     */
    'prefer-rest-params': 'error',
    /**
     * Require using spread syntax instead of `.apply()`.
     *
     * 🚫 Not fixable - https://eslint.org/docs/rules/prefer-spread
     */
    'prefer-spread': 'error',
    /**
     * Require using template literals instead of string concatenation.
     *
     * 🔧 Fixable - https://eslint.org/docs/rules/prefer-template
     */
    'prefer-template': 'warn',
    /**
     * Require a `Symbol` description.
     *
     * 🚫 Not fixable - https://eslint.org/docs/rules/symbol-description
     */
    'symbol-description': 'error',
  },
};
