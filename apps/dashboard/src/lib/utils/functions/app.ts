export function toggleBodyByMode(isDark) {
  if (!document) return;

  if (isDark) {
    document.body.className = document.body.className.concat(' ', 'dark');
  } else {
    document.body.className = document.body.className.replace(' dark', '');
  }
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
  return /lms[/a-z 0-9 -]*/.test(path);
}

export function isActive(pagePath: string, itemPath: string, matchPattern?: string, exact: boolean = false) {
  // If a regex pattern is provided, use it for matching
  if (matchPattern) {
    try {
      const regex = new RegExp(matchPattern);
      return regex.test(pagePath);
    } catch (error) {
      console.warn('Invalid regex pattern in isActive:', matchPattern, error);
      // Fall through to default matching logic
    }
  }

  // Normalize paths by removing trailing slashes (except root)
  const normalizedPagePath = pagePath === '/' ? '/' : pagePath.replace(/\/$/, '');
  const normalizedItemPath = itemPath === '/' ? '/' : itemPath.replace(/\/$/, '');

  if (exact) {
    return normalizedPagePath === normalizedItemPath;
  }

  // Exact match
  if (normalizedPagePath === normalizedItemPath) {
    return true;
  }

  // Check if pagePath is a nested route of itemPath
  // e.g., /org/[slug]/courses matches /org/[slug]/courses/123
  // We need to ensure we match at path segment boundaries
  const pagePathWithSlash = normalizedPagePath + '/';
  const itemPathWithSlash = normalizedItemPath + '/';

  return pagePathWithSlash.startsWith(itemPathWithSlash);
}
