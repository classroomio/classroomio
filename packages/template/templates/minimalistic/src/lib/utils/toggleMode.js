/**
 * @param {boolean} isDark
 */
export function toggleBodyByMode(isDark) {
  if (!document) return;

  if (isDark) {
    document.body.className = document.body.className.concat(' ', 'dark');
  } else {
    document.body.className = document.body.className.replace(' dark', '');
  }
}
