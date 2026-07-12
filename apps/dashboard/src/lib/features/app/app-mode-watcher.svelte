<script lang="ts">
  import { onMount } from 'svelte';
  import { ModeWatcher, setMode, systemPrefersMode, userPrefersMode } from '@cio/ui/base/dark-mode';

  import { resolveStoredColorMode } from '$lib/utils/functions/color-mode';

  onMount(() => {
    const preference = resolveStoredColorMode();

    if (preference === 'system') {
      systemPrefersMode.tracking(true);
      systemPrefersMode.query();

      if (userPrefersMode.current !== 'system') {
        setMode('system');
      }

      return;
    }

    systemPrefersMode.tracking(false);

    if (userPrefersMode.current !== preference) {
      setMode(preference);
    }
  });
</script>

<ModeWatcher defaultMode="light" disableHeadScriptInjection track={false} />
