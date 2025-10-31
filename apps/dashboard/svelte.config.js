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
      $mail: path.resolve('./src/mail'),
      '$src/tools': path.resolve('../../packages/ui/src/tools/index.ts'),
      '$src/base/*': path.resolve('../../packages/ui/src/base/*'),
      '@cio/ui': path.resolve('../../packages/ui/src'),
      '@cio/ui/*': path.resolve('../../packages/ui/src/*'),
      '@cio/api': path.resolve('../api/dist'),
      '@cio/api/*': path.resolve('../api/dist/*')
    }
  }
};

export default config;
