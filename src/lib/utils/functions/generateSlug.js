function generateSlug(title) {
  return title
    .match(/[^\W\s\d]*/g, '')
    .join('-')
    .toLowerCase()
    .concat(`-${new Date().getTime()}`);
}

export default generateSlug;
