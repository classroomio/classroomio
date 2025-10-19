/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';
import forms from '@tailwindcss/forms';

export default {
  darkMode: 'class',
  content: ['./src/**/*.{html,js,svelte,ts}', '../../packages/text-editor/src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {}
  },
  plugins: [typography, forms]
};
