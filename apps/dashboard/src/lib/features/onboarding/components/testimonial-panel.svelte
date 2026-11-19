<script lang="ts">
  import { BrandWash } from '@cio/ui/custom/animation';
  import { SenjaEmbed } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import { TESTIMONIALS_WIDGET_ID } from '../utils/constants';

  const HIGHLIGHT_MARKER = '\u2063';

  const [headlineStart, headlineEnd = ''] = $derived(
    $t('onboarding.testimonials.headline', { highlight: HIGHLIGHT_MARKER }).split(HIGHLIGHT_MARKER)
  );
</script>

<aside
  aria-labelledby="onboarding-testimonials-title"
  class="flex min-w-0 px-4 pb-4 lg:sticky lg:top-0 lg:h-screen lg:py-3 lg:pr-3 lg:pl-0"
>
  <div
    class="ui:bg-muted ui:notch-cutout relative isolate flex min-w-0 flex-1 flex-col justify-center gap-7 overflow-hidden rounded-2xl py-10 lg:py-14"
  >
    <BrandWash class="-z-10" />

    <div class="max-w-xl px-6 lg:px-12">
      <p class="ui:text-muted-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
        {$t('onboarding.testimonials.eyebrow')}
      </p>
      <h2
        id="onboarding-testimonials-title"
        class="mt-3 text-2xl leading-tight font-extrabold tracking-tight text-balance lg:text-3xl dark:text-white"
      >
        {headlineStart}<span
          class="bg-[linear-gradient(transparent_58%,color-mix(in_srgb,var(--primary)_30%,transparent)_58%,color-mix(in_srgb,var(--primary)_30%,transparent)_92%,transparent_92%)] bg-no-repeat px-1"
          >{$t('onboarding.testimonials.headline_highlight')}</span
        >{headlineEnd}
      </h2>
      <p class="ui:text-muted-foreground mt-2.5 text-sm lg:text-base">{$t('onboarding.testimonials.subtitle')}</p>
    </div>

    <SenjaEmbed id={TESTIMONIALS_WIDGET_ID} mode="shadow" />

    <p class="ui:text-muted-foreground px-6 text-[11px] font-semibold tracking-[0.14em] uppercase lg:px-12">
      {$t('onboarding.testimonials.footer')}
    </p>
  </div>
</aside>
