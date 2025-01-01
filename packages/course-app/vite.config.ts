import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'bin/create-template.ts'),
      formats: ['es'],
      fileName: 'create-template'
    },
    rollupOptions: {
      external: ['commander', 'inquirer', 'chalk', 'ora', 'fs', 'path', 'url', 'figlet', 'fs-extra']
    },
    target: 'node14',
    outDir: 'dist',
    emptyOutDir: true
  }
});
