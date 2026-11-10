<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import * as Card from '@cio/ui/base/card';

  import ZapierMark from '$features/automation/components/zapier-mark.svelte';
  import type { ZapierConnection } from '$features/automation/utils/types';
  import { formatZapierDate, getZapierAccess, ZAPIER_LOGO_URL } from '$features/automation/utils/zapier-utils';
  import { locale, t } from '$lib/utils/functions/translations';

  interface Props {
    connections: ZapierConnection[];
    onDisconnect: (connection: ZapierConnection) => void;
  }

  let { connections, onDisconnect }: Props = $props();

  const T = 'automation.zapier.connection';
</script>

<Card.Root class="gap-0 p-0" data-testid="zapier-connections">
  {#each connections as connection, index (connection.consentId)}
    <div class="flex flex-wrap items-center gap-4 p-4 {index > 0 ? 'ui:border-border border-t' : ''}">
      <ZapierMark src={ZAPIER_LOGO_URL} name="Zapier" />

      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <p class="text-sm font-medium">{$t(`${T}.name`)}</p>
          <Badge variant="secondary">{$t(`${T}.access_${getZapierAccess(connection.scopes)}`)}</Badge>
        </div>
        <p class="ui:text-muted-foreground text-sm">
          {$t(`${T}.connected_by`, {
            name: connection.authorizedBy.fullname ?? $t(`${T}.unknown_admin`),
            date: formatZapierDate(connection.connectedAt, $locale) ?? ''
          })}
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        onclick={() => onDisconnect(connection)}
        testId="zapier-disconnect-{connection.consentId}"
      >
        {$t(`${T}.disconnect`)}
      </Button>
    </div>
  {/each}
</Card.Root>
