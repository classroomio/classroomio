<script lang="ts">
  import * as Avatar from '@cio/ui/base/avatar';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
  import { shortenName } from '$lib/utils/functions/string';
  import { globalStore } from '$lib/utils/store/app';

  const orgPath = $derived($globalStore.isOrgSite ? '/lms' : $currentOrgPath);
</script>

<Sidebar.Menu>
  <Sidebar.MenuItem>
    <Sidebar.MenuButton
      size="sm"
      class="ui:data-[state=open]:bg-sidebar-accent ui:data-[state=open]:text-sidebar-accent-foreground"
    >
      {#snippet child({ props })}
        <a href={orgPath} {...props}>
          {#if $currentOrg.name}
            <Avatar.Root class="flex size-6! items-center justify-center rounded-md!">
              <Avatar.Image src={$currentOrg.avatarUrl} alt={$currentOrg.name} />
              <Avatar.Fallback class="rounded-md! text-xs">{shortenName($currentOrg.name)}</Avatar.Fallback>
            </Avatar.Root>
            <span class="truncate text-sm">{$currentOrg.name}</span>
          {:else}
            <Skeleton class="h-4 w-24" />
          {/if}
        </a>
      {/snippet}
    </Sidebar.MenuButton>
  </Sidebar.MenuItem>
</Sidebar.Menu>
