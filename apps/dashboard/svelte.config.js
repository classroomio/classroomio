import { vitePreprocess } from '@sveltejs/kit/vite';
import vercelAdapter from '@sveltejs/adapter-vercel';
import path from 'path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: [vitePreprocess({})],

  kit: {
    adapter: vercelAdapter(),
    alias: {
      $lib: path.resolve('./src/lib'),
      $defer: path.resolve('./src/defer')
    }
  }
};

export default config;
