import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.resolve(__dirname, '../dist/create-template.js');

fs.readFile(cliPath, 'utf8', (err, data) => {
  if (err) throw err;
  const newContent = `${data}`;
  fs.writeFile(cliPath, newContent, (err) => {
    if (err) throw err;
    fs.chmodSync(cliPath, '755');
  });
});
