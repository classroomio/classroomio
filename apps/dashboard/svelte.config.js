import { vitePreprocess } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-auto';
import adapterNode from '@sveltejs/adapter-node';
import path from 'path';

import 'dotenv/config';

console.log('\n\n=======config: ', process.env.IS_SELFHOSTED);

const useNodeAdapter = process.env.IS_SELFHOSTED === 'true';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: [vitePreprocess({})],

  kit: {
    adapter: useNodeAdapter ? adapterNode() : adapter(),
    alias: {
      $lib: path.resolve('./src/lib'),
      $mail: path.resolve('./src/mail')
    }
  }
};

export default config;
