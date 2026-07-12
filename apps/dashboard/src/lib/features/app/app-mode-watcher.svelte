<script lang="ts">
  import { browser } from '$app/environment';
  import { ModeWatcher, setMode, systemPrefersMode, userPrefersMode } from '@cio/ui/base/dark-mode';

  import { readStoredColorMode } from '$lib/utils/functions/color-mode';

  function syncColorModeTracking() {
    const shouldTrackSystem = userPrefersMode.current === 'system';
    systemPrefersMode.tracking(shouldTrackSystem);

    if (shouldTrackSystem) {
      systemPrefersMode.query();
    }
  }

  $effect(() => {
    if (!browser) {
      return;
    }

    const storedPreference = readStoredColorMode();
    userPrefersMode.current;

    if (storedPreference !== 'system' && userPrefersMode.current !== storedPreference) {
      setMode(storedPreference);
    }

    syncColorModeTracking();
  });
</script>

<ModeWatcher defaultMode="light" disableHeadScriptInjection track={false} />
