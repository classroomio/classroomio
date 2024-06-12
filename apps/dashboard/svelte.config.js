import { vitePreprocess } from '@sveltejs/kit/vite';
import Adapter from '@sveltejs/adapter-auto';
import path from 'path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: [vitePreprocess({})],

  kit: {
    adapter: Adapter(),
    alias: {
      $lib: path.resolve('./src/lib'),
      $mail: path.resolve('./src/mail')
    }
  }
};

export default config;
