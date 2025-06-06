const nanoid = require('nanoid');

function getExtension(filename) {
  const ext = path.extname(filename || '').split('.');
  return ext[ext.length - 1];
}

exports.generateFileKey = (fileName) => {
  return `${nanoid()}.${getExtension(fileName)}`;
};
