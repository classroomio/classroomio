<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import { Empty } from '@cio/ui/custom/empty';

  import { t } from '$lib/utils/functions/translations';

  interface Props {
    titleKey: string;
    descriptionKey: string;
  }

  let { titleKey, descriptionKey }: Props = $props();
</script>

<Empty title={$t(titleKey)} description={$t(descriptionKey)}>
  <Badge variant="secondary">{$t('automation.coming_soon')}</Badge>
</Empty>
