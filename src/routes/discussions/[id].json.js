import _discussions from './_discussions.js';

const lookup = new Map();
_discussions.forEach((discussion) => {
  lookup.set(`${discussion.id}`, JSON.stringify(discussion));
});

export function get(req, res, next) {
  // the `id` parameter is available because
  // this file is called [id].json.js
  const { id } = req.params;

  if (lookup.has(id)) {
    res.writeHead(200, {
      'Content-Type': 'application/json',
    });

    res.end(lookup.get(id));
  } else {
    res.writeHead(404, {
      'Content-Type': 'application/json',
    });

    res.end(
      JSON.stringify({
        message: `Not found`,
      })
    );
  }
}
