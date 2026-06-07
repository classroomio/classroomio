<script lang="ts">
  import { page } from '$app/state';

  import { CourseLandingPage } from '$features/ui';
  import { PoweredBy } from '$features/ui';

  let { data } = $props();

  const orgName = $derived(data.org?.name ?? data.course?.org?.name ?? 'ClassroomIO');

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
      ...(data.course.logo ? { image: data.course.logo } : {})
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
  <PoweredBy />
  <CourseLandingPage courseData={data.course} org={data.org} themeComponent={data.themeComponent} />
{/if}
