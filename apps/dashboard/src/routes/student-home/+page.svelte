<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import { t } from '$lib/utils/functions/translations';
</script>

<div class="flex h-screen w-full items-center justify-center">
  <Block.Loader
    blockText={false}
    title={$t('common.loading_states.opening_academy.title')}
    caption={$t('common.loading_states.opening_academy.caption')}
  />
</div>
