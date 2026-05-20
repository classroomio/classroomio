<script lang="ts">
  import * as Avatar from '@cio/ui/base/avatar';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { currentOrg } from '$lib/utils/store/org';
  import { Badge } from '@cio/ui/base/badge';
  import { PLAN_NAMES, PLAN } from '@cio/utils/plans';
  import { BRAND_ROOT_DOMAIN, TENANT_ROOT_DOMAIN } from '@cio/utils/constants';

  const plan = $derived($currentOrg.plans?.[0]?.planName || PLAN.BASIC);
  const utmSource = $derived(
    $currentOrg.customDomain ||
      ($currentOrg.siteName ? `${$currentOrg.siteName}.${TENANT_ROOT_DOMAIN}` : BRAND_ROOT_DOMAIN)
  );
</script>

<Sidebar.Menu>
  <Sidebar.MenuItem>
    <Sidebar.MenuButton
      size="sm"
      class="ui:data-[state=open]:bg-sidebar-accent ui:data-[state=open]:text-sidebar-accent-foreground"
    >
      {#snippet child({ props })}
        <a
          href="https://{BRAND_ROOT_DOMAIN}?utm_source={utmSource}"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          <Avatar.Root class="ui:flex ui:size-6 ui:items-center ui:justify-center">
            <Avatar.Image src="/logo-192.png" alt="ClassroomIO logo" />
          </Avatar.Root>

          <span class="truncate font-normal">ClassroomIO</span>
          <Badge variant="outline" class="capitalize">
            {PLAN_NAMES[plan] || plan}
          </Badge>
        </a>
      {/snippet}
    </Sidebar.MenuButton>
  </Sidebar.MenuItem>
</Sidebar.Menu>
