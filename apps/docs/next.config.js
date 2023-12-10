const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx'
});

module.exports = {
  basePath: '/docs',
  ...withNextra(),
  async rewrites() {
    return [
      {
        source: '/:path*',
        destination: `https://classroomio-com.vercel.app/:path*`
      }
    ];
  }
};
