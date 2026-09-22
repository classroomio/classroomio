<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import { LandingButton, SecondaryActionButton } from '@cio/ui/custom/org-landing-page';
  import type { LearningPathDetail } from '@cio/ui/custom/org-landing-page';

  interface Props {
    detail: LearningPathDetail;
    orgName: string;
    enrolledHref: string;
  }

  let { detail, orgName, enrolledHref }: Props = $props();
</script>

<section class="ui:bg-card ui:border-border border-b">
  <div class="mx-auto w-full max-w-4xl px-4 py-12 md:px-6">
    <p class="ui:text-muted-foreground mb-2 text-sm tracking-wide uppercase">{orgName}</p>

    <h1 class="ui:text-foreground text-3xl font-bold md:text-4xl">{detail.title}</h1>

    <p class="ui:text-muted-foreground mt-4 max-w-2xl text-lg">{detail.description}</p>

    <div class="ui:text-muted-foreground mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
      <span>
        {t.get('public_learning_paths.course_count_label', { count: detail.courseCount })}
      </span>

      <span>
        {t.get('public_learning_paths.detail.hours_label', { hours: detail.totalHours })}
      </span>

      {#if detail.hasCertificate}
        <span>{t.get('public_learning_paths.certificate_label')}</span>
      {/if}

      <span>
        {t.get('public_learning_paths.enrolled_label', { count: detail.totalStudents })}
      </span>
    </div>

    <div class="mt-8 flex flex-wrap items-center gap-4">
      <LandingButton href={enrolledHref} class="ui:bg-primary">
        {detail.cost === 0
          ? t.get('public_learning_paths.detail.enroll_free')
          : t.get('public_learning_paths.detail.enroll_label', { cost: detail.cost, currency: detail.currency })}
      </LandingButton>

      {#if detail.metadata?.discount && detail.metadata?.showDiscount}
        <SecondaryActionButton href="/learning-paths">
          {t.get('public_learning_paths.detail.view_all')}
        </SecondaryActionButton>
      {/if}
    </div>
  </div>
</section>
