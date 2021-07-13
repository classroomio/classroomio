import { getCourse } from './_db';

function writeJsonHead(res, statusCode) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
  });
}

export function get(req, res, next) {
  const { id } = req.query;

  writeJsonHead(res, 200);

  return res.end(JSON.stringify(getCourse(id)));
}
