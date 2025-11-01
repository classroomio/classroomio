function generateSlug(title) {
  return title
    .match(/[^\W\s\d]*/g, '')
    .filter((v = '') => !!v.trim())
    .join('-')
    .toLowerCase()
    .concat(`-${new Date().getTime()}`);
}

export default generateSlug;
