import { lighten } from 'color2k';

export function setTheme(theme: string) {
  // this condition is to check if it's a hex code coming from the db or it's a specified theme
  if (theme && !theme.includes('theme-')) {
    // this adds the "custom-theme" styles to the head tag
    injectCustomTheme(theme);

    // this adds the "custom-theme" classname to the head tag 
    setCustomTheme('theme-custom');
  } else {

    // if the string passed has "theme" in it, it goes on with the existing logic
    if (!theme && document.body.className.includes('theme-')) {
          const regex = /theme-[\w]+/gi;
          document.body.className = document.body.className.replace(regex, theme || '');
          return;
        }
      
        // In case theme already exists in dom, don't add
        if (document.body.className.includes(theme || '')) return;
      
        localStorage.setItem('theme', theme || '');
        document.body.className = document.body.className.concat(' ', theme || '');
  }
}

export function setCustomTheme(theme?: string) {
  // In case the default theme is added but another theme exists
  if (!theme && document.body.className.includes('theme-')) {
    const regex = /theme-[\w]+/gi;
    document.body.className = document.body.className.replace(regex, theme || '');
    return;
  }

  // Remove any class starting with "theme-"
  const regex = /theme-[\w]+/gi;
  document.body.className = document.body.className.replace(regex, '');

  // Add the new theme if it doesn't already exist
  if (!document.body.className.includes(theme || '')) {
    localStorage.setItem('theme', theme || '');
    document.body.className = document.body.className.concat(' ', theme || '');
  }
}


export function injectCustomTheme(hex: string) {
  const styleId = 'theme-custom';
  let styleElement = document.getElementById(styleId);

  // generate shades using color2k's lighten function
  const shades = {
    50: lighten(hex, 0.9),
    100: lighten(hex, 0.8),
    200: lighten(hex, 0.7),
    300: lighten(hex, 0.6),
    400: lighten(hex, 0.5),
    500: lighten(hex, 0.4),
    600: lighten(hex, 0.3),
    700: lighten(hex, 0.2),
    800: lighten(hex, 0.1),
    900: hex, // the original color
  };

  const styleContent = `
    .theme-custom .bg-primary-50 { background-color: ${shades[50]} !important; }
    .theme-custom .bg-primary-100 { background-color: ${shades[100]} !important; }
    .theme-custom .bg-primary-200 { background-color: ${shades[200]} !important; }
    .theme-custom .bg-primary-300 { background-color: ${shades[300]} !important; }
    .theme-custom .bg-primary-400 { background-color: ${shades[400]} !important; }
    .theme-custom .bg-primary-500 { background-color: ${shades[500]} !important; }
    .theme-custom .bg-primary-600 { background-color: ${shades[600]} !important; }
    .theme-custom .bg-primary-700 { background-color: ${shades[700]} !important; }
    .theme-custom .bg-primary-800 { background-color: ${shades[800]} !important; }
    .theme-custom .bg-primary-900 { background-color: ${shades[900]} !important; }

    .theme-custom .text-primary-50 { color: ${shades[50]} !important; }
    .theme-custom .text-primary-100 { color: ${shades[100]} !important; }
    .theme-custom .text-primary-200 { color: ${shades[200]} !important; }
    .theme-custom .text-primary-300 { color: ${shades[300]} !important; }
    .theme-custom .text-primary-400 { color: ${shades[400]} !important; }
    .theme-custom .text-primary-500 { color: ${shades[500]} !important; }
    .theme-custom .text-primary-600 { color: ${shades[600]} !important; }
    .theme-custom .text-primary-700 { color: ${shades[700]} !important; }
    .theme-custom .text-primary-800 { color: ${shades[800]} !important; }
    .theme-custom .text-primary-900 { color: ${shades[900]} !important; }

    .theme-custom .border-primary-50 { border-color: ${shades[50]} !important; }
    .theme-custom .border-primary-100 { border-color: ${shades[100]} !important; }
    .theme-custom .border-primary-200 { border-color: ${shades[200]} !important; }
    .theme-custom .border-primary-300 { border-color: ${shades[300]} !important; }
    .theme-custom .border-primary-400 { border-color: ${shades[400]} !important; }
    .theme-custom .border-primary-500 { border-color: ${shades[500]} !important; }
    .theme-custom .border-primary-600 { border-color: ${shades[600]} !important; }
    .theme-custom .border-primary-700 { border-color: ${shades[700]} !important; }
    .theme-custom .border-primary-800 { border-color: ${shades[800]} !important; }
    .theme-custom .border-primary-900 { border-color: ${shades[900]} !important; }
  `;

  if (styleElement) {
    styleElement.innerHTML = styleContent;
  } else {
    styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.innerHTML = styleContent;
    document.head.appendChild(styleElement);
  }
}
