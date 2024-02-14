const env = process.env.NODE_ENV;

const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx'
});

module.exports = {
  basePath: env === 'production' ? '/docs' : undefined,
  env: {
    imagePath: env === 'production' ? '/docs' : ''
  },
  images: {
    unoptimized: true
  },
  ...withNextra()
};
