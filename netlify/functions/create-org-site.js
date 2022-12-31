const { NetlifyAPI } = require('netlify');

exports.handler = async function (event) {
  // your server-side functionality
  // const { siteName } = JSON.parse(event.body);
  console.log(
    'process.env.SVELTE_APP_NETLIFY_API_KEY',
    process.env.SVELTE_APP_NETLIFY_API_KEY
  );
  const client = new NetlifyAPI(process.env.SVELTE_APP_NETLIFY_API_KEY);
  const sites = await client.listSites();

  return {
    statusCode: 200,
    body: JSON.stringify({ sites }),
  };
};
