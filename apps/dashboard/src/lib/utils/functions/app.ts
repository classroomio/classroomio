export function toggleBodyByMode(isDark) {
  if (!document) return;

  if (isDark) {
    document.body.className = document.body.className.concat(' ', 'dark');
  } else {
    document.body.className = document.body.className.replace(' dark', '');
  }
}

export class AppUtils {
  isPathwaysPage(path: string) {
    return /pathways\/[a-z 0-9 -]/.test(path);
  }

  isCoursesPage(path: string) {
    return /courses\/[a-z 0-9 -]/.test(path);
  }

  isCoursePage(path: string) {
    return /course\/[a-z 0-9 -]/.test(path);
  }

  isOrgPage(path: string) {
    return /org\/[a-z 0-9 -]/.test(path);
  }

  isQuizPage(path: string) {
    return /org\/[a-z 0-9 -]+\/quiz\/[a-z 0-9 -]/.test(path);
  }

  isLMSPage(path: string) {
    return /lms\/[a-z 0-9 -]*/.test(path);
  }
}

export function useOrgNavigation(path: string) {
  const appUtils = new AppUtils();

  return (
    appUtils.isOrgPage(path) ||
    path.includes('profile') ||
    appUtils.isCoursesPage(path) ||
    appUtils.isPathwaysPage(path)
  );
}
