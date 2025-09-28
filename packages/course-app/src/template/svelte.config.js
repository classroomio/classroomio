import { escapeSvelte, mdsvex } from 'mdsvex';

import adapter from '@sveltejs/adapter-auto';
import { createHighlighter } from 'shiki';
import rehypeSlug from 'rehype-slug';
import rehypeUnwrapImages from 'rehype-unwrap-images';
import remarkToc from 'remark-toc';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('mdsvex').MdsvexOptions} */
const mdsvexOptions = {
  extensions: ['.md'],
  highlight: {
    highlighter: async (code, lang = 'text') => {
      const highlighter = await createHighlighter({
        themes: ['poimandres'],
        langs: ['javascript', 'typescript']
      });
      await highlighter.loadLanguage('javascript', 'typescript');
      const html = escapeSvelte(highlighter.codeToHtml(code, { lang, theme: 'poimandres' }));
      return `{@html \`${html}\` }`;
    }
  },
  remarkPlugins: [[remarkToc, { tight: true }]],
  rehypePlugins: [rehypeSlug]
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: [
    vitePreprocess({
      script: true
    }),
    mdsvex(mdsvexOptions)
  ],

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
