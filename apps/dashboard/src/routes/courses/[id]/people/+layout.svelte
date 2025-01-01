<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import CourseContainer from '$lib/components/CourseContainer/index.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import PageBody from '$lib/components/PageBody/index.svelte';
  import PageNav from '$lib/components/PageNav/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import RoleBasedSecurity from '$lib/components/RoleBasedSecurity/index.svelte';
  import { t } from '$lib/utils/functions/translations';
  import ArrowLeft from 'carbon-icons-svelte/lib/ArrowLeft.svelte';

  export let data;

  const handleClick = () => {
    const url = $page.url.href + '?add=true';
    goto(url);
  };
</script>

<CourseContainer bind:courseId={data.courseId}>
  <PageNav title={$t('course.navItem.people.title')} disableSticky={true}>
    <slot:fragment slot="image">
      {#if data.personId}
        <RoleBasedSecurity allowedRoles={[1, 2]}>
          <IconButton
            size="large"
            onClick={() => {
              goto(`/courses/${data.courseId}/people`);
            }}
          >
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
