export function isCoursePage(path) {
  return /course[s]*\/[a-z 0-9 -]/.test(path);
}

export function isOrgPage(path) {
  return /org\/[a-z 0-9 -]/.test(path);
}
