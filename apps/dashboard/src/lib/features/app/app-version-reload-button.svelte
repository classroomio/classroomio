<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';

  let loading = $state(false);

  function handleReload() {
    if (loading) {
      return;
    }

    loading = true;
    setTimeout(() => location.reload());
  }
</script>

<Button size="xs" {loading} onclick={handleReload}>{$t('common.app_update.reload')}</Button>
