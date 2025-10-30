import 'dotenv/config';

import adapterNode from '@sveltejs/adapter-node';
import adapterVercel from '@sveltejs/adapter-vercel';
import path from 'path';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const useNodeAdapter = process.env.PUBLIC_IS_SELFHOSTED === 'true';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: [vitePreprocess({})],
  kit: {
    adapter: useNodeAdapter ? adapterNode() : adapterVercel(),
    alias: {
      $lib: path.resolve('./src/lib'),
      $mail: path.resolve('./src/mail')
    }
  }
};

export default config;
