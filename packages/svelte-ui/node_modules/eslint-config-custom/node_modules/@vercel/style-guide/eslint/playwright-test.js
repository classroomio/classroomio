module.exports = {
  extends: [
    'plugin:playwright/playwright-test',
    require.resolve('./rules/playwright-test.js'),
  ],
};
