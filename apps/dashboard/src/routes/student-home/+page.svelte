<script lang="ts">
  import { BlockLoader } from '@cio/ui/custom/block-loader';
  import { t } from '$lib/utils/functions/translations';
</script>

<div class="flex h-screen w-full items-center justify-center">
  <BlockLoader
    blockText={false}
    title={$t('common.loading_states.opening_academy.title')}
    caption={$t('common.loading_states.opening_academy.caption')}
  />
</div>
