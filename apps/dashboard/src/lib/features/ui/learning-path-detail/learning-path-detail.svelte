<script lang="ts">
  import { resolve } from '$app/paths';

  import { t } from '$lib/utils/functions/translations';

  import { Accordion } from '@cio/ui/base/accordion';
  import {
    LearningPathDetailHero,
    LearningPathDetailSeries,
    LearningPathDetailCertificate,
    LearningPathDetailInstructors,
    LearningPathDetailReviews
  } from './components/';

  import type { LearningPathDetail } from '@cio/ui/custom/org-landing-page';

  interface Props {
    detail: LearningPathDetail;
    orgName: string;
  }

  let { detail, orgName }: Props = $props();

  const firstSeriesSlug = detail.series[0]?.slug;

  const enrolledHref = $derived(firstSeriesSlug ? resolve(`/courses/${firstSeriesSlug}`, {}) : '#');
</script>

<article>
  <LearningPathDetailHero {detail} {orgName} {enrolledHref} />

  <LearningPathDetailSeries series={detail.series} />

  <LearningPathDetailCertificate certificate={detail.certificate} hasCertificate={detail.hasCertificate} />

  <LearningPathDetailInstructors instructors={detail.instructors} />

  <LearningPathDetailReviews reviews={detail.reviews} />

  <section class="mx-auto w-full max-w-4xl px-4 py-12 md:px-6">
    <h2 class="ui:text-foreground mb-6 text-2xl font-semibold">{t.get('public_learning_paths.detail.faq_heading')}</h2>

    {#if detail.faq.length > 0}
      <Accordion.Root type="single" collapsible>
        {#each detail.faq as item (item.id)}
          <Accordion.Item value={item.id}>
            <Accordion.Trigger class="ui:bg-card ui:text-foreground text-left">{item.question}</Accordion.Trigger>
            <Accordion.Content class="ui:text-muted-foreground">{item.answer}</Accordion.Content>
          </Accordion.Item>
        {/each}
      </Accordion.Root>
    {:else}
      <p class="ui:text-muted-foreground">{t.get('public_learning_paths.detail.no_faq')}</p>
    {/if}
  </section>
</article>
