export function setTheme(theme: string) {
  // In case the default theme is added but another theme exists
  if (!theme && document.body.className.includes('theme-')) {
    const regex = /theme-[\w]+/gi;
    document.body.className = document.body.className.replace(regex, theme);
    return;
  }

  // In case theme already exists in dom, don't add
  if (document.body.className.includes(theme)) return;

  document.body.className = document.body.className.concat(' ', theme);
}
