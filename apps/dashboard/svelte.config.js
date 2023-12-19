import { vitePreprocess } from '@sveltejs/kit/vite';
import vercelAdapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: [vitePreprocess({})],

  kit: {
    adapter: vercelAdapter()
  }
};

export default config;
