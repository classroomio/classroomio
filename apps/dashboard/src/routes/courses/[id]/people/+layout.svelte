<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { PageBody, PageNav } from '$lib/components/Page';
  import { Button } from '@cio/ui/base/button';
  import { RoleBasedSecurity } from '$lib/features/ui';
  import { t } from '$lib/utils/functions/translations';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import { CourseContainer } from '$lib/components/CourseContainer';

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

<CourseContainer courseId={data.courseId}>
  <PageNav title={$t('course.navItem.people.title')} disableSticky={true}>
    {#snippet image()}
      {#if data.personId}
        <RoleBasedSecurity allowedRoles={[1, 2]}>
          <IconButton onclick={handleBackNavigation}>
            <ArrowLeftIcon size={16} />
          </IconButton>
        </RoleBasedSecurity>
      {/if}
    {/snippet}
    {#snippet widget()}
      {#if !data.personId}
        <RoleBasedSecurity allowedRoles={[1, 2]}>
          <Button class="mr-2" onclick={handleClick}>
            {$t('course.navItem.people.add')}
          </Button>
        </RoleBasedSecurity>
      {/if}
    {/snippet}
  </PageNav>
  <PageBody width="w-full max-w-6xl md:w-11/12">
    {@render children?.()}
  </PageBody>
</CourseContainer>
