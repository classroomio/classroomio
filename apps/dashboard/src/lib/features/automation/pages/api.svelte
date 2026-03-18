<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import * as Alert from '@cio/ui/base/alert';
  import * as Field from '@cio/ui/base/field';
</script>

<Field.Group class="w-full max-w-5xl! space-y-8 px-2">
  <Alert.Callout
    variant="information"
    title={$t('automation.tabs.api')}
    description={$t('automation.coming_soon')}
    class="w-full"
  />
</Field.Group>
