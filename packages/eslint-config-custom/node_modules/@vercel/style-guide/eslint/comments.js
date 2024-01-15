module.exports = {
  extends: [
    'plugin:eslint-comments/recommended',
    require.resolve('./rules/comments'),
  ],
};
