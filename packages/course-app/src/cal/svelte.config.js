import sequence from 'svelte-sequential-preprocessor';
import { mdsvex, escapeSvelte } from 'mdsvex';
import * as shiki from 'shiki';
import rehypeUnwrapImages from 'rehype-unwrap-images';
import remarkToc from 'remark-toc';
import rehypeSlug from 'rehype-slug';
import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('mdsvex').MdsvexOptions} */
const mdsvexOptions = {
  extensions: ['.md'],
  layout: {
    // _: './src/mdsvex/Mdsvex.svelte'
  },
  highlight: {
    highlighter: async (code, lang = 'text') => {
      const highlighter = await shiki.getHighlighter({ theme: 'poimandres' });
      const html = escapeSvelte(highlighter.codeToHtml(code, { lang }));
      return `{@html \`${html}\` }`;
    }
  },
  remarkPlugins: [rehypeUnwrapImages, [remarkToc, { tight: true }]],
  rehypePlugins: [rehypeSlug]
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: sequence([vitePreprocess(), mdsvex(mdsvexOptions)]),

  kit: {
    // adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
    // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
    // See https://svelte.dev/docs/kit/adapters for more information about adapters.
    adapter: adapter(),

    alias: {
      '@/*': './src/lib/*',
      $lib: './src/lib',
      '$lib/*': './src/lib/*'
    }
  },

  extensions: ['.svelte', '.md']
};

export default config;
