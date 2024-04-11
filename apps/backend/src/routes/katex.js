const express = require('express');
// https://ben.page/node-latex-to-html
const katex = require('katex');

const router = express.Router();

// localhost:3002/katex
router.get('/', async (req, res) => {
  try {
    const original = req._parsedUrl.search;

    const latexString = original
      .replace('?', '')
      .replaceAll('&plus;', '+')
      .replaceAll('&space;', '');
    console.log({ latexString });

    const html = katex.renderToString(latexString, {
      throwOnError: false,
      output: 'mathml'
    });

    console.log({ html });

    res.send(html);
  } catch (error) {
    res.send('failed');
  }
});

module.exports = router;
