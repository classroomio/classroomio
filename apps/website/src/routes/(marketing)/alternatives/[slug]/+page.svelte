<script lang="ts">
  import '$lib/features/alternatives/alternatives.css';
  import { CtaButton } from '$lib/components/ui';
  import AlternativeCard from '$lib/features/alternatives/components/alternative-card.svelte';
  import {
    CARDS,
    CHECKED,
    COMPETITORS,
    FEATURES,
    PRICING_URLS,
    SHARED,
    getRelatedSlugs
  } from '$lib/features/alternatives/content';
  import { featureViz, viz } from '$lib/features/alternatives/visuals/mockups';
  import { heroStage } from '$lib/features/alternatives/visuals/hero-stage';
  import { icon, markWord } from '$lib/features/alternatives/visuals/ui';
  import type { CompetitorSlug } from '$lib/features/alternatives/types';

  let { data } = $props();

  const page = $derived(data.page);
  const competitor = $derived(data.competitor);
  const slug = $derived(data.slug as CompetitorSlug);
  const relatedSlugs = $derived(getRelatedSlugs(slug));
  const priceCard = $derived(CARDS[slug]);
  const pricingUrl = $derived(PRICING_URLS[slug]);
  const checked = CHECKED;

  let openFaq = $state(0);

  const CAPTION = 'Illustrative mockup with sample data. Not a product screenshot.';

  function jsonLdScript(value: unknown): string {
    return `<script type="application/ld+json">${JSON.stringify(value)}<` + `/script>`;
  }

  const jsonLd = $derived({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: SHARED.faq.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer }
    }))
  });
</script>

<svelte:head>
  {@html jsonLdScript(jsonLd)}
</svelte:head>

<div class="alternative-page pt-18">
  <div class="hero-wrap">
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-grid">
        <div class="hero-copy">
          <span class="eyebrow">Exploring alternatives to {competitor.name}</span>
          <h1 id="hero-title">{@html markWord(page.headline, page.mark)}</h1>
          <p class="lead">{page.sub}</p>
          <div class="hero-cta">
            <CtaButton
              href={page.cta.primary[1]}
              variant="primary"
              size="lg"
              arrow
              class="h-[52px] rounded-[10px] px-6 font-bold !text-white hover:!text-white"
            >
              {page.cta.primary[0]}
            </CtaButton>
            <CtaButton
              href={page.cta.secondary[1]}
              variant="secondary"
              size="lg"
              class="h-[52px] rounded-[10px] border-[var(--sand-deep)] bg-transparent px-6 text-base hover:bg-[var(--sand)] hover:brightness-100"
            >
              {page.cta.secondary[0]}
            </CtaButton>
          </div>
          <ul class="chips">
            {#each page.chips as chip}
              <li>{@html icon('check')}{chip}</li>
            {/each}
          </ul>
        </div>
        <div class="hero-viz">
          {@html heroStage(page.hero)}
          <p class="cap">{CAPTION}</p>
        </div>
      </div>
    </section>
  </div>

  <section class="section" id="pick" aria-labelledby="pick-title">
    <div class="wrap">
      <div class="sec-head center">
        <h2 class="h2" id="pick-title">Which one should you pick?</h2>
        <p class="lead">{page.pick.lead}</p>
      </div>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AlternativeCard variant="pick" title={page.pick.them.title}>
          <ul class="pick-list">
            {#each page.pick.them.points as point}
              <li>{@html icon('check')}<span>{point}</span></li>
            {/each}
          </ul>
        </AlternativeCard>
        <AlternativeCard variant="pick" title={page.pick.us.title}>
          <ul class="pick-list">
            {#each page.pick.us.points as point}
              <li>{@html icon('check')}<span>{point}</span></li>
            {/each}
          </ul>
        </AlternativeCard>
      </div>
    </div>
  </section>

  <section class="section" id="why" aria-labelledby="why-title">
    <div class="wrap">
      <div class="sec-head center">
        <h2 class="h2" id="why-title">{SHARED.move.title}</h2>
        <p class="lead">{SHARED.move.sub}</p>
      </div>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        {#each SHARED.move.items as [title, text]}
          <AlternativeCard variant="problem" {title} description={text} />
        {/each}
      </div>
    </div>
  </section>

  <section class="section tint" id="classroomio" aria-labelledby="intro-title">
    <div class="wrap intro-grid">
      <div class="intro-copy">
        <span class="eyebrow">{SHARED.intro.eyebrow ?? 'The short version'}</span>
        <h2 class="h2" id="intro-title">{SHARED.intro.title}</h2>
        <ol class="steps">
          {#each SHARED.intro.steps as [title, text], index}
            <li>
              <span class="n">0{index + 1}</span>
              <div>
                <b>{title}</b>
                <span>{text}</span>
              </div>
            </li>
          {/each}
        </ol>
      </div>
      <div>
        {@html viz(SHARED.intro.viz)}
        <p class="cap">{CAPTION}</p>
      </div>
    </div>
  </section>

  <section class="section" id="features" aria-labelledby="feat-title">
    <div class="wrap">
      <div class="sec-head">
        <span class="eyebrow">{SHARED.features.eyebrow ?? 'Where ClassroomIO differs'}</span>
        <h2 class="h2" id="feat-title">{SHARED.features.title}</h2>
        <p class="lead">{SHARED.features.lead}</p>
      </div>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {#each SHARED.features.items as item, index}
          {@const base = FEATURES[item.key]}
          {#if base}
            <AlternativeCard variant="feat" wide={index === 0}>
              <div class="feat-viz">
                {@html featureViz(base.viz)}
              </div>
              <div>
                <h3 class="flex items-center gap-2.5 text-[19px] font-semibold tracking-[-0.02em] text-[var(--ink)]">
                  {@html icon(base.icon)}{item.title ?? base.title}
                </h3>
                <p class="mt-2 text-[15px] leading-relaxed text-[var(--body)]">
                  {item.text ?? base.text}
                </p>
              </div>
            </AlternativeCard>
          {/if}
        {/each}
      </div>
    </div>
  </section>

  <section class="section showcase" id="product" aria-labelledby="show-title">
    <div class="wrap show-grid">
      <div class="show-copy">
        <span class="eyebrow">{page.showcase.eyebrow}</span>
        <h2 class="h2" id="show-title">{page.showcase.title}</h2>
        <p class="lead">{page.showcase.text}</p>
        <ul class="ticks">
          {#each page.showcase.points as point}
            <li>{@html icon('check')}<span>{point}</span></li>
          {/each}
        </ul>
      </div>
      <div>
        {@html viz(page.showcase.viz)}
        <p class="cap">{CAPTION}</p>
      </div>
    </div>
  </section>

  <section class="section sand" id="price" aria-labelledby="price-title">
    <div class="wrap">
      <div class="sec-head">
        <span class="eyebrow">{SHARED.plans.eyebrow}</span>
        <h2 class="h2" id="price-title">{SHARED.plans.title}</h2>
        <p class="lead">{SHARED.plans.lead}</p>
      </div>
      <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
        <AlternativeCard
          variant="price"
          title={SHARED.plans.us.name}
          class="us !border-[var(--blue)] shadow-[0_0_0_1px_var(--blue)]"
        >
          <p class="price-big">{SHARED.plans.us.price} <small>{SHARED.plans.us.unit}</small></p>
          <p class="price-text">{SHARED.plans.us.text}</p>
          <p class="price-foot">
            {SHARED.plans.us.foot}
            <a href={SHARED.plans.us.link[1]}>{SHARED.plans.us.link[0]}</a>
          </p>
        </AlternativeCard>
        <AlternativeCard variant="price" title={competitor.name}>
          <p class="price-big">
            {priceCard.price}
            {#if priceCard.unit}<small>{priceCard.unit}</small>{/if}
          </p>
          <p class="price-text">{priceCard.text}</p>
          <p class="price-foot">
            From <a href={pricingUrl} target="_blank" rel="noopener">{competitor.name}'s pricing page</a>, checked
            {checked}.
          </p>
        </AlternativeCard>
      </div>
    </div>
  </section>

  <section class="section sand" id="faq" aria-labelledby="faq-title">
    <div class="wrap grid grid-cols-1 items-start gap-8 overflow-visible lg:grid-cols-[4fr_8fr] lg:gap-12">
      <div class="grid content-start gap-4 self-start overflow-visible lg:sticky lg:top-[112px]">
        <span class="eyebrow">FAQ</span>
        <h2 class="h2" id="faq-title">ClassroomIO: common questions</h2>
        <p class="lead">Short answers based on what we have verified about the product.</p>
        <a class="link-arrow" href="/pricing">See ClassroomIO plans{@html icon('arrow')}</a>
      </div>
      <div class="grid gap-2.5">
        {#each SHARED.faq as [question, answer], index}
          <AlternativeCard variant="faq" open={openFaq === index}>
            <button
              class="faq-q"
              id="faq-q-{index}"
              aria-expanded={openFaq === index}
              aria-controls="faq-{index}"
              onclick={() => (openFaq = openFaq === index ? -1 : index)}
            >
              {question}
              {@html icon('plus')}
            </button>
            <div
              class="faq-a"
              id="faq-{index}"
              role="region"
              aria-labelledby="faq-q-{index}"
              aria-hidden={openFaq !== index}
              inert={openFaq !== index}
            >
              <div><p>{answer}</p></div>
            </div>
          </AlternativeCard>
        {/each}
      </div>
    </div>
  </section>

  <section class="section" id="related" aria-labelledby="read-title">
    <div class="wrap">
      <div class="sec-head">
        <span class="eyebrow">Keep reading</span>
        <h2 class="h2" id="read-title">More on {competitor.name} and the alternatives</h2>
        <p class="lead">Comparing more than one platform? See how ClassroomIO stacks up against these.</p>
      </div>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        {#each relatedSlugs as otherSlug}
          {@const other = COMPETITORS[otherSlug]}
          <AlternativeCard href={`/alternatives/${otherSlug}`} variant="read">
            <span class="tag">Alternatives</span>
            <b class="text-[18px] leading-[1.25] font-semibold tracking-[-0.02em] text-[var(--ink)]"
              >{other.name} alternative</b
            >
            <span class="text-sm leading-relaxed text-[var(--muted)]">{other.blurb}</span>
          </AlternativeCard>
        {/each}
      </div>
    </div>
  </section>
</div>
