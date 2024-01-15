const { JAVASCRIPT_FILES } = require('./constants');
const requirePackage = require('./utils/require-package');

requirePackage('next', '@next/eslint-plugin-next');

const babelOptions = {
  presets: (() => {
    try {
      require.resolve('next/babel');
      return ['next/babel'];
    } catch (e) {
      return [];
    }
  })(),
};

module.exports = {
  extends: ['plugin:@next/next/recommended'],
  overrides: [
    {
      files: JAVASCRIPT_FILES,
      parserOptions: { babelOptions },
    },
  ],
};
