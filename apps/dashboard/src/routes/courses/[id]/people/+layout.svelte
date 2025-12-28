<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { Button } from '@cio/ui/base/button';
  import { RoleBasedSecurity } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import * as Page from '@cio/ui/base/page';

  let { data = $bindable(), children } = $props();

  // Get back URL from query parameters
  let backUrl = $derived(page.url.searchParams.get('back'));

  const handleClick = () => {
    const url = page.url.href + '?add=true';
    goto(url);
  };

  const handleBackNavigation = () => {
    if (backUrl) {
      goto(backUrl);
    } else {
      goto(`/courses/${data.courseId}/people`);
    }
  };
</script>


  <div class="mx-auto w-full max-w-3xl">
    <Page.Header>
      {#if data.personId}
        <RoleBasedSecurity allowedRoles={[1, 2]}>
          <IconButton onclick={handleBackNavigation}>
            <ArrowLeftIcon size={16} />
          </IconButton>
        </RoleBasedSecurity>
      {/if}
      <Page.HeaderContent>
        <Page.Title>
          {$t('course.navItem.people.title')}
        </Page.Title>
      </Page.HeaderContent>
      <Page.Action>
        {#if !data.personId}
          <RoleBasedSecurity allowedRoles={[1, 2]}>
            <Button class="mr-2" onclick={handleClick}>
              {$t('course.navItem.people.add')}
            </Button>
          </RoleBasedSecurity>
        {/if}
      </Page.Action>
    </Page.Header>

    <Page.Body>
      {#snippet child()}
        {@render children?.()}
      {/snippet}
    </Page.Body>
  </div>

