/** @type {import('tailwindcss').Config}*/
const config = {
  content: ['./src/**/*.{html,js,svelte,ts}'],

  theme: {
    extend: {}
  },

  plugins: []
};

module.exports = config;
// generic name for component
// add theme-name dynamically on body
// have globaly style for theme-name .bg-primary-100
