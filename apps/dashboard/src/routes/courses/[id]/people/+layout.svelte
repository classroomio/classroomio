<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import CourseContainer from '$lib/components/CourseContainer/index.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import { PageBody, PageNav } from '$lib/components/Page';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import RoleBasedSecurity from '$lib/components/RoleBasedSecurity/index.svelte';
  import { t } from '$lib/utils/functions/translations';
  import ArrowLeft from 'carbon-icons-svelte/lib/ArrowLeft.svelte';

  export let data;

  // Get back URL from query parameters
  $: backUrl = $page.url.searchParams.get('back');

  const handleClick = () => {
    const url = $page.url.href + '?add=true';
    goto(url);
  };

  const handleBackNavigation = () => {
    if (backUrl) {
      goto(backUrl);
    } else {
      // Default fallback to course people page
      goto(`/courses/${data.courseId}/people`);
    }
  };
</script>

<CourseContainer bind:courseId={data.courseId}>
  <PageNav title={$t('course.navItem.people.title')} disableSticky={true}>
    <slot:fragment slot="image">
      {#if data.personId}
        <RoleBasedSecurity allowedRoles={[1, 2]}>
          <IconButton size="large" onClick={handleBackNavigation}>
            <ArrowLeft size={16} class="carbon-icon dark:text-white " />
          </IconButton>
        </RoleBasedSecurity>
      {/if}
    </slot:fragment>
    <slot:fragment slot="widget">
      {#if !data.personId}
        <RoleBasedSecurity allowedRoles={[1, 2]}>
          <PrimaryButton
            className="mr-2"
            label={$t('course.navItem.people.add')}
            onClick={handleClick}
          />
        </RoleBasedSecurity>
      {/if}
    </slot:fragment>
  </PageNav>
  <PageBody width="w-full max-w-6xl md:w-11/12">
    <slot />
  </PageBody>
</CourseContainer>
