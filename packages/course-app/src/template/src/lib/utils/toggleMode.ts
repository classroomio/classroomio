export function toggleBodyByMode(isDark: boolean) {
  if (!document) return;

  if (isDark) {
    document.body.className = document.body.className.concat('', ' dark');
  } else {
    document.body.className = document.body.className.replaceAll(' dark', '');
  }
}
