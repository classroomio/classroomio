module.exports = {
  darkMode: 'class',
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
  plugins: [require('@tailwindcss/typography'), require('@tailwindcss/forms')],
};
