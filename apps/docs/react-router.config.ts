import type { Config } from '@react-router/dev/config';

export default {
  ssr: true,
  basename: '/docs',
  future: {
    v8_viteEnvironmentApi: true
  }
} satisfies Config;
