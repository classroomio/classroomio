<script lang="ts">
  import { page } from '$app/state';

  import { CourseLandingPage } from '$features/ui';
  import { PoweredBy } from '$features/ui';
  import { OwnerEditBar } from '@cio/ui/custom/owner-edit-bar';
  import { t } from '$lib/utils/functions/translations';

  let { data } = $props();

  const orgName = $derived(data.org?.name ?? data.course?.org?.name ?? 'ClassroomIO');
  const editBarLinks = $derived.by(() => {
    const ownerEditBar = data.ownerEditBar;
    const courseId = data.course?.id;
    const isSameOrg = !!ownerEditBar && data.course?.org?.id === ownerEditBar.orgId;
    if (!ownerEditBar || !courseId || !isSameOrg) return null;

    const courseBase = `${ownerEditBar.adminOrigin}/courses/${encodeURIComponent(courseId)}`;

    return [
      { href: `${courseBase}/landingpage`, label: $t('owner_edit_bar.course.edit_landing_page'), primary: true },
      { href: `${courseBase}/lessons`, label: $t('owner_edit_bar.course.edit_lessons') },
      { href: `${courseBase}/settings`, label: $t('owner_edit_bar.course.settings') }
    ];
  });

  const courseImage = $derived(data.course?.bannerImage || '');

  const courseJsonLd = $derived.by(() => {
    if (!data.course) return null;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: data.course.title,
      description: data.course.description || '',
      provider: {
        '@type': 'Organization',
        name: orgName
      },
      url: page.url.href,
      ...(courseImage ? { image: courseImage } : {})
    };

    return JSON.stringify(schema).replace(/</g, '\\u003c');
  });
</script>

<svelte:head>
  {#if courseJsonLd}
    {@html `<script type="application/ld+json">${courseJsonLd}</script>`}
  {/if}
</svelte:head>

{#if data.course}
  <PoweredBy offset={!!editBarLinks} />
  <CourseLandingPage courseData={data.course} org={data.org} themeComponent={data.themeComponent} />
  {#if editBarLinks}
    <OwnerEditBar
      label={$t('owner_edit_bar.label')}
      regionLabel={$t('owner_edit_bar.region_label')}
      links={editBarLinks}
    />
  {/if}
{/if}
