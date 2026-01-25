<script lang="ts">
  import { resolve } from '$app/paths';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    logo: string | undefined;
    orgName: string | undefined;
  }

  let { logo, orgName }: Props = $props();
</script>

<div class="logo">
  <a
    href={resolve('/')}
    title={`${$t('navigation.goto')} ${orgName || 'ClassroomIO'} ${$t('navigation.home')}`}
    class="flex items-center gap-2"
    id="logo"
    data-hveid="8"
  >
    <img
      src={logo || '/logo-192.png'}
      alt={`${orgName || 'ClassroomIO'} logo`}
      class="mx-auto inline-block w-9 rounded"
      data-atf="1"
    />
    {#if orgName}
      <span class="line-clamp-1 hidden text-sm font-medium md:block">{orgName}</span>
    {/if}
  </a>
</div>
