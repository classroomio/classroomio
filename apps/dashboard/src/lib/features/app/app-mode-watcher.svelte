<script lang="ts">
  import { browser } from '$app/environment';
  import {
    ModeWatcher,
    createInitialModeExpression,
    setMode,
    systemPrefersMode,
    userPrefersMode
  } from '@cio/ui/base/dark-mode';

  import { MODE_STORAGE_KEY, readStoredColorMode } from '$lib/utils/functions/color-mode';

  const initialModeScript = createInitialModeExpression({
    defaultMode: 'light',
    modeStorageKey: MODE_STORAGE_KEY
  });

  $effect(() => {
    if (!browser) {
      return;
    }

    const storedPreference = readStoredColorMode();
    systemPrefersMode.tracking(storedPreference === 'system');

    if (storedPreference !== 'system' && userPrefersMode.current !== storedPreference) {
      setMode(storedPreference);
    }
  });
</script>

<svelte:head>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html initialModeScript}
</svelte:head>

<ModeWatcher defaultMode="light" disableHeadScriptInjection />
