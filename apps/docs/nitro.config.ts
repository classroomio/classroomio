import { defineNitroConfig } from 'nitro/config';

export default defineNitroConfig({
  compatibilityDate: '2026-03-13',
  preset: 'cloudflare_module',
  cloudflare: {
    deployConfig: true,
    nodeCompat: true
  }
});
