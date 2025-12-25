import { darken, lighten } from 'color2k';

import { tc } from '$lib/utils/functions/trycatch';

export function setTheme(theme: string) {
  localStorage.setItem('theme', theme);

  if (theme.includes('#')) {
    const escapedHex = theme.replace(/"/g, '\\"');
    document.body.setAttribute('data-theme', escapedHex);

    injectCustomTheme(escapedHex);
  } else {
    document.body.setAttribute('data-theme', theme);
  }
}

// Handle this functions in a try catch if hex is not valid.
const _lighten = (hex: string, no: number) => tc(() => lighten(hex, no), hex);
const _darken = (hex: string, no: number) => tc(() => darken(hex, no), hex);

export function injectCustomTheme(hex: string) {
  // Generate shades using color2k's lighten/darken functions
  // Following the same pattern as predefined themes (e.g., purple)
  const shades = {
    50: _lighten(hex, 0.7),
    100: _lighten(hex, 0.6),
    200: _lighten(hex, 0.5),
    300: _lighten(hex, 0.4),
    400: _lighten(hex, 0.3),
    500: _lighten(hex, 0.2),
    600: _lighten(hex, 0.1),
    700: hex,
    800: _darken(hex, 0.1),
    900: _darken(hex, 0.2)
  };

  const styleContent = `
    body[data-theme="${hex}"] {
      --primary: ${shades[700]};
      --primary-foreground: ${shades[50]};
      --ring: ${shades[400]};
      --chart-1: ${shades[300]};
      --chart-2: ${shades[500]};
      --chart-3: ${shades[600]};
      --chart-4: ${shades[700]};
      --chart-5: ${shades[800]};
      --sidebar-primary: ${shades[700]};
      --sidebar-primary-foreground: ${shades[50]};
      --sidebar-accent: ${shades[50]};
      --sidebar-accent-foreground: ${shades[700]};
      --sidebar-ring: ${shades[400]};
    }

    body.dark[data-theme="${hex}"],
    html.dark body[data-theme="${hex}"] {
      --primary: ${shades[500]};
      --primary-foreground: ${shades[50]};
      --ring: ${shades[900]};
      --sidebar-primary: ${shades[500]};
      --sidebar-primary-foreground: ${shades[50]};
      --sidebar-accent: oklch(0.268 0.007 34.298);
      --sidebar-accent-foreground: ${shades[500]};
      --sidebar-ring: ${shades[900]};
    }
  `;

  const styleElement = document.createElement('style');
  styleElement.innerHTML = styleContent;
  document.head.appendChild(styleElement);
}
