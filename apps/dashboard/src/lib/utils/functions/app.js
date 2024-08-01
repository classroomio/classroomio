export function toggleBodyByMode(isDark) {
  if (!document) return;

  if (isDark) {
    document.body.className = document.body.className.concat(' ', 'dark');
  } else {
    document.body.className = document.body.className.replace(' dark', '');
  }
}

export function isPathwayPage(path) {
  return /pathways\/[a-z 0-9 -]/.test(path);
}

export function isCoursesPage(path) {
  return /courses\/[a-z 0-9 -]/.test(path);
}

export function isCoursePage(path) {
  return /course\/[a-z 0-9 -]/.test(path);
}

export function isOrgPage(path) {
  return /org\/[a-z 0-9 -]/.test(path);
}

export function isQuizPage(path) {
  return /org\/[a-z 0-9 -]+\/quiz\/[a-z 0-9 -]/.test(path);
}

export function isLMSPage(path) {
  return /lms[\/a-z 0-9 -]*/.test(path);
}
