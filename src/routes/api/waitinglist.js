function writeJsonHead(res, statusCode) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
  });
}

export function post(req, res) {
  const { email } = req.body;

  console.log(`req.session`, req.session);

  writeJsonHead(res, 200);

  return res.end(JSON.stringify({ success: true }));
}
