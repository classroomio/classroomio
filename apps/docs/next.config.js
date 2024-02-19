const million = require('million/compiler');

const env = process.env.NODE_ENV;

const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx'
});

const nextConfig = {
  basePath: env === 'production' ? '/docs' : undefined,
  env: {
    imagePath: env === 'production' ? '/docs' : ''
  },
  images: {
    unoptimized: true
  },
  ...withNextra()
};

const millionConfig = {
  auto: true
};

module.exports = million.next(nextConfig, millionConfig);
