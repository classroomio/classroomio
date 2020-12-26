module.exports = {
  purge: {
    mode: 'all',
    content: ['./**/**/*.html', './**/**/*.svelte'],

    options: {
      whitelistPatterns: [/svelte-/],
    },
  },

  theme: {
    extend: {},
  },
  variants: {},
  plugins: [],
};
