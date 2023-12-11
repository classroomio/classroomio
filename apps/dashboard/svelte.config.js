import { vitePreprocess } from '@sveltejs/kit/vite';
import vercelAdapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: [vitePreprocess({})],

  kit: {
    adapter: vercelAdapter(),
    files: {
      // Add this line to include test files
      template: {
        // ...
        transform: 'svelte-jester'
      }
    }
  }
};

export default config;
