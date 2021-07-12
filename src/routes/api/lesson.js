import { getLecture } from './_lessons';

function writeJsonHead(res, statusCode) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
  });
}

export function get(req, res, next) {
  // the `id` parameter is available because
  // this file is called [id].json.js
  const { id } = req.params;

  if (lookup.has(id)) {
    writeJsonHead(res, 200);

    res.end(lookup.get(id));
  } else {
    writeJsonHead(res, 404);

    res.end(
      JSON.stringify({
        message: `Not found`,
      })
    );
  }
}
