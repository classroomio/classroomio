import { defineConfig } from 'vite';

export default defineConfig({
  base: '/activity/player-assets/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    modulePreload: false
  },
  server: {
    port: Number(process.env.ACTIVITY_PLAYER_PORT ?? 3004),
    strictPort: false
  }
});
