import { defineConfig } from 'tsup';

const cfg = {
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: false,
  dts: true,
  format: ['esm', 'cjs'],
};

export default defineConfig([
  {
    ...cfg,
    entry: {
      index: 'src/generic.ts',
    },
    outDir: 'dist',
  },
  {
    ...cfg,
    entry: {
      index: 'src/nextjs/index.tsx',
    },
    external: ['react', 'next'],
    outDir: 'dist/next',
    esbuildOptions: (options) => {
      // Append "use client" to the top of the react entry point
      options.banner = {
        js: '"use client";',
      };
    },
  },
  {
    ...cfg,
    entry: {
      index: 'src/nuxt/index.ts',
    },
    external: ['vue', 'vue-router'],
    outDir: 'dist/nuxt',
  },
  {
    ...cfg,
    entry: {
      index: 'src/remix/index.tsx',
    },
    external: ['react', '@remix-run/react'],
    outDir: 'dist/remix',
  },
  {
    ...cfg,
    entry: {
      index: 'src/sveltekit/index.ts',
    },
    external: ['svelte', '@sveltejs/kit', '$app'],
    outDir: 'dist/sveltekit',
  },
  {
    ...cfg,
    entry: {
      index: 'src/vue/index.ts',
    },
    external: ['vue', 'vue-router'],
    outDir: 'dist/vue',
  },
  {
    ...cfg,
    entry: {
      index: 'src/react/index.tsx',
    },
    external: ['react'],
    outDir: 'dist/react',
  },
]);
