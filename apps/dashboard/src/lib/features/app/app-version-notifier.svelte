<script lang="ts">
  import { updated } from '$app/state';
  import { toast } from '@cio/ui/base/sonner';
  import { t } from '$lib/utils/functions/translations';
  import { onMount } from 'svelte';

  const UPDATE_TOAST_ID = 'app-version-update';

  function showUpdateToast() {
    toast.info(t.get('common.app_update.title'), {
      id: UPDATE_TOAST_ID,
      duration: Number.POSITIVE_INFINITY,
      description: t.get('common.app_update.description'),
      action: {
        label: t.get('common.app_update.reload'),
        onClick: () => location.reload()
      }
    });
  }

  onMount(() => {
    function handlePreloadError(event: Event) {
      event.preventDefault();
      showUpdateToast();
    }

    function handleVisibilityChange() {
      if (document.visibilityState !== 'visible') {
        return;
      }

      void updated.check();
    }

    window.addEventListener('vite:preloadError', handlePreloadError);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('vite:preloadError', handlePreloadError);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  });

  $effect(() => {
    if (!updated.current) {
      return;
    }

    showUpdateToast();
  });
</script>
