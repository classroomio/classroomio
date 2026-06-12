import path from 'node:path';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const devApiUrl = process.env.API_URL ?? 'http://localhost:3002';

function embedApiUrlInjectPlugin() {
  const bootstrapFiles = [
    path.resolve(dirname, 'src/widgets/course-widget/bootstrap.ts'),
    path.resolve(dirname, 'src/widgets/question-type-picker/bootstrap.ts')
  ];

  return {
    name: 'embed-api-url-inject',
    transform(code: string, id: string) {
      if (!bootstrapFiles.includes(id) || !devApiUrl) {
        return null;
      }

      const snippet = `window.CIO=window.CIO||{};window.CIO.apiBaseUrl=${JSON.stringify(devApiUrl.replace(/\/$/, ''))};`;
      return { code: `${snippet}\n${code}`, map: null };
    }
  };
}
const embedEntries = {
  'question-type-picker': path.resolve(dirname, 'src/widgets/question-type-picker/bootstrap.ts'),
  'course-widget': path.resolve(dirname, 'src/widgets/course-widget/bootstrap.ts')
} as const;
const embedDevEntrypoints = {
  '/question-type-picker': '/src/widgets/question-type-picker/bootstrap.ts',
  '/course-widget': '/src/widgets/course-widget/bootstrap.ts',
  '/embeds/question-type-picker/question-type-picker.js': '/src/widgets/question-type-picker/bootstrap.ts',
  '/embeds/course-widget/course-widget.js': '/src/widgets/course-widget/bootstrap.ts',
  '/embeds/course-widget/embed.html': '/src/widgets/course-widget/embed.html'
} as const;

function embedDevEntryPlugin() {
  return {
    name: 'embed-dev-entry-plugin',
    configureServer(server: {
      middlewares: { use: (handler: (req: { url?: string }, res: unknown, next: () => void) => void) => void };
    }) {
      server.middlewares.use((req, _res, next) => {
        const requestUrl = req.url ?? '';
        const [pathname, search = ''] = requestUrl.split('?');
        const querySuffix = search ? `?${search}` : '';

        if (pathname === '/course-widget') {
          const params = new URLSearchParams(search);
          const target = params.has('key')
            ? '/src/widgets/course-widget/embed.html'
            : '/src/widgets/course-widget/bootstrap.ts';
          req.url = `${target}${querySuffix}`;
          next();
          return;
        }

        if (pathname === '/question-type-picker') {
          req.url = `/src/widgets/question-type-picker/bootstrap.ts${querySuffix}`;
          next();
          return;
        }

        const rewrittenPath = embedDevEntrypoints[pathname as keyof typeof embedDevEntrypoints];

        if (rewrittenPath) {
          req.url = `${rewrittenPath}${querySuffix}`;
        }

        next();
      });
    }
  };
}

export default defineConfig(({ command, mode }) => {
  const buildTarget = mode in embedEntries ? (mode as keyof typeof embedEntries) : null;
  const buildEntry = buildTarget ? { [buildTarget]: embedEntries[buildTarget] } : embedEntries;

  return {
    root: dirname,
    plugins: [
      embedDevEntryPlugin(),
      ...(command === 'serve' ? [embedApiUrlInjectPlugin()] : []),
      tailwindcss(),
      svelte(),
      cssInjectedByJsPlugin()
    ],
    resolve: {
      alias: {
        '@cio/ui': path.resolve(dirname, 'node_modules/@cio/ui/src'),
        '@cio/ui/*': path.resolve(dirname, 'node_modules/@cio/ui/src/*'),
        $src: path.resolve(dirname, 'node_modules/@cio/ui/src')
      },
      conditions: ['svelte', 'browser', 'import']
    },
    optimizeDeps: {
      include: ['svelte-tiptap'],
      exclude: ['@tiptap/core', '@tiptap/pm']
    },
    build:
      command === 'build'
        ? {
            outDir: buildTarget ? `dist/${buildTarget}` : 'dist',
            emptyOutDir: false,
            cssCodeSplit: false,
            lib: {
              entry: buildEntry,
              name: 'CIOEmbeds',
              formats: ['es'],
              fileName: (_format, entryName) => `${entryName}.js`
            },
            rollupOptions: {
              output: {
                inlineDynamicImports: false,
                chunkFileNames: buildTarget ? `${buildTarget}-[name]-[hash].js` : '[name]-[hash].js'
              }
            }
          }
        : {},
    server: {
      port: 5180,
      cors: true
    },
    preview: {
      port: 4180,
      cors: true
    }
  };
});
