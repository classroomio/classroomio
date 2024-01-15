// Source: https://github.com/playwright-community/eslint-plugin-playwright/blob/main/src/index.ts
const recommended = {
  'no-empty-pattern': 'off',
  'playwright/expect-expect': 'warn',
  'playwright/max-nested-describe': 'warn',
  'playwright/missing-playwright-await': 'error',
  'playwright/no-conditional-in-test': 'warn',
  'playwright/no-element-handle': 'warn',
  'playwright/no-eval': 'warn',
  'playwright/no-focused-test': 'error',
  'playwright/no-force-option': 'warn',
  'playwright/no-nested-step': 'warn',
  'playwright/no-networkidle': 'error',
  'playwright/no-page-pause': 'warn',
  'playwright/no-skipped-test': 'warn',
  'playwright/no-useless-await': 'warn',
  'playwright/no-useless-not': 'warn',
  'playwright/no-wait-for-timeout': 'warn',
  'playwright/prefer-web-first-assertions': 'error',
  'playwright/valid-expect': 'error',
};

module.exports = {
  rules: {
    ...recommended,
    /**
     * Require lowercase test names.
     *
     * 🔧 Fixable - https://github.com/playwright-community/eslint-plugin-playwright/blob/main/docs/rules/prefer-lowercase-title.md
     */
    'playwright/prefer-lowercase-title': 'warn',
    /**
     * Require using `toHaveLength` over explicitly checking lengths.
     *
     * 🔧 Fixable - https://github.com/playwright-community/eslint-plugin-playwright/blob/main/docs/rules/prefer-lowercase-title.md
     */
    'playwright/prefer-to-have-length': 'warn',
    /**
     * Require test cases and hooks to be inside a `test.describe` block.
     *
     * 🚫 Not fixable - https://github.com/playwright-community/eslint-plugin-playwright/blob/main/docs/rules/prefer-lowercase-title.md
     */
    'playwright/require-top-level-describe': 'error',
  },
};
