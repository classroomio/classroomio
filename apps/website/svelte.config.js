import adapterNode from '@sveltejs/adapter-auto';
import adapterVercel from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { mdsvex, escapeSvelte } from 'mdsvex';
import path from 'path';
import shiki from 'shiki';
import remarkUnwrapImages from 'remark-unwrap-images';
import remarkToc from 'remark-toc';
import rehypeSlug from 'rehype-slug';

const useNodeAdapter = process.env.PUBLIC_IS_SELFHOSTED === 'true';

/** @type {import('@sveltejs/kit').Config}*/

/** @type {import('mdsvex').MdsvexOptions} */
const mdsvexOptions = {
  extensions: ['.md'],
  layout: {
    _: dirname(fileURLToPath(import.meta.url)) + '/src/mdsvex.svelte'
  },
  highlight: {
    highlighter: async (code, lang = 'text') => {
      const highlighter = await shiki.getHighlighter({ theme: 'poimandres' });
      const html = escapeSvelte(highlighter.codeToHtml(code, { lang }));
      return `{@html \`${html}\` }`;
    }
  },
  remarkPlugins: [remarkUnwrapImages, [remarkToc, { tight: true }]],
  rehypePlugins: [rehypeSlug]
};

const config = {
  kit: {
    adapter: useNodeAdapter ? adapterNode() : adapterVercel(),
    alias: {
      $lib: path.resolve('./src/lib'),
      '$src/tools': path.resolve('./node_modules/@cio/ui/src/tools/index.ts'),
      '$src/base/*': path.resolve('./node_modules/@cio/ui/src/base/*'),
      '@cio/ui': path.resolve('./node_modules/@cio/ui/src'),
      '@cio/ui/*': path.resolve('./node_modules/@cio/ui/src/*'),
      '@cio/utils': path.resolve('./node_modules/@cio/utils/dist'),
      '@cio/utils/*': path.resolve('./node_modules/@cio/utils/dist/*')
    }
  },
  extensions: ['.svelte', '.md'],
  preprocess: [vitePreprocess(), mdsvex(mdsvexOptions)]
};
export default config;
