<script lang="ts">
  import { page } from '$app/state';

  import { PoweredBy, LearningPathDetail } from '$features/ui';
  import type { LearningPathDetail as LearningPathDetailType } from '@cio/ui/custom/org-landing-page';

  let { data } = $props();

  const orgName = $derived(data.org?.name ?? 'ClassroomIO');

  const learningPathJsonLd = $derived.by(() => {
    if (!data.detail) return null;

    const detail: LearningPathDetailType = data.detail;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: detail.title,
      description: detail.description || '',
      provider: {
        '@type': 'Organization',
        name: orgName
      },
      url: page.url.href,
      ...(detail.logo ? { image: detail.logo } : {}),
      numberOfCredits: detail.courseCount,
      offers: {
        '@type': 'Offer',
        price: detail.cost,
        priceCurrency: detail.currency
      },
      hasPart: detail.series.map((course) => ({
        '@type': 'Course',
        name: course.title,
        description: course.description,
        isAccessibleForFree: course.cost === 0
      }))
    };

    return JSON.stringify(schema).replace(/</g, '\\u003c');
  });
</script>

<svelte:head>
  {#if learningPathJsonLd}
    {@html `<script type="application/ld+json">${learningPathJsonLd}</script>`}
  {/if}
</svelte:head>

{#if data.detail}
  <PoweredBy />
  <LearningPathDetail detail={data.detail} org={data.org} themeComponent={data.themeComponent} />
{/if}
