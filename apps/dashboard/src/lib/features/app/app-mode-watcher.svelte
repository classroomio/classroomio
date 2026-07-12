<script lang="ts">
  import { browser } from '$app/environment';
  import { ModeWatcher, setMode, systemPrefersMode, userPrefersMode } from '@cio/ui/base/dark-mode';

  import { readStoredColorMode } from '$lib/utils/functions/color-mode';

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

<ModeWatcher defaultMode="light" />
