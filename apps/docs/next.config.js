const withNextra = require('nextra')('nextra-theme-blog', './theme.config.js')
const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/
})

module.exports = withNextra(withMDX({
  basePath: env === 'production' ? '/docs' : undefined,
  env: {
    imagePath: env === 'production' ? '/docs' : ''
  },

  pageExtensions: ['js', 'jsx', 'md', 'mdx']
}));
