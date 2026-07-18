// Runs before the app bundle to set the color mode and prevent a flash of the
// wrong theme. Lives as an external same-origin file (not inline in app.html)
// because the app's CSP has a nonce and no 'unsafe-inline', which blocks inline
// scripts — an external 'self' script is allowed. Seeding localStorage here also
// beats mode-watcher's eager "system" default write when the module loads.
//
// Keep the stale-"system" rule in sync with resolveStoredColorMode in
// src/lib/utils/functions/color-mode.ts.
(function () {
  try {
    var storageKey = 'mode-watcher-mode';
    var explicitKey = 'mode-watcher-explicit';
    var stored = localStorage.getItem(storageKey);
    var isExplicit = localStorage.getItem(explicitKey) === 'true';
    var mode = 'light';

    if (stored === 'light' || stored === 'dark') {
      mode = stored;
    } else if (stored === 'system' && isExplicit) {
      mode = 'system';
    }

    var isLight =
      mode === 'light' ||
      (mode === 'system' && window.matchMedia('(prefers-color-scheme: light)').matches);

    var root = document.documentElement;

    if (isLight) {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    } else {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    }

    localStorage.setItem(storageKey, mode);
  } catch (error) {
    // Ignore storage / matchMedia errors in restricted environments.
  }
})();
