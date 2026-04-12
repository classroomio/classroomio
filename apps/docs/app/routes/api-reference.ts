import { getHtmlDocument } from '@scalar/core/libs/html-rendering';

const publicApiSpecUrl = 'https://api.cdn.clsrio.com/openapi/public-api/openapi-latest.json';

export function loader() {
  return new Response(
    getHtmlDocument({
      url: publicApiSpecUrl,
      pageTitle: 'ClassroomIO Public API Reference',
      theme: 'none'
    }),
    {
      headers: {
        'content-type': 'text/html; charset=utf-8'
      }
    }
  );
}
