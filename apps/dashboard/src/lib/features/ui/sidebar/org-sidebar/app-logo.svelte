<script lang="ts">
  import * as Avatar from '@cio/ui/base/avatar';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { currentOrg } from '$lib/utils/store/org';
  import { Badge } from '@cio/ui/base/badge';

  const planName = $derived($currentOrg.plans?.[0]?.planName || 'FREE');
</script>

<Sidebar.Menu>
  <Sidebar.MenuItem>
    <Sidebar.MenuButton
      size="sm"
      class="ui:data-[state=open]:bg-sidebar-accent ui:data-[state=open]:text-sidebar-accent-foreground"
    >
      {#snippet child({ props })}
        <a
          href="https://classroomio.com?utm_source={$currentOrg.siteName}.classroomio.com"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          <Avatar.Root class="ui:flex ui:size-6 ui:items-center ui:justify-center">
            <Avatar.Image src="/logo-192.png" alt="ClassroomIO logo" />
          </Avatar.Root>

          <span class="truncate font-normal">ClassroomIO</span>
          <Badge variant="outline" class="capitalize">
            {planName.toLowerCase()}
          </Badge>
        </a>
      {/snippet}
    </Sidebar.MenuButton>
  </Sidebar.MenuItem>
</Sidebar.Menu>
