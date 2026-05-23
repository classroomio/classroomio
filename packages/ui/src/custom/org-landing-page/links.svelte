<script lang="ts">
  import type { LandingPageLinks, OrgLandingPageLabels, OrgLandingPageTheme } from './types';
  import { landingPageLinkIconMap } from './landing-page-link-icons';
  import { BorderBeam } from '../animation/border-beam';
  import { DotPattern } from '../animation/dot-pattern';
  import * as Card from '../../base/card';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import EditableLandingSection from './editable-section.svelte';

  let {
    links,
    variant = 'minimal',
    labels
  }: {
    links?: LandingPageLinks;
    variant?: OrgLandingPageTheme;
    labels?: OrgLandingPageLabels;
  } = $props();

  const resolvedResourcesEyebrow = $derived(labels?.resourcesEyebrow ?? 'Resources');

  function linkDisplayHint(href: string) {
    const trimmed = href.trim();
    if (!trimmed) return '';

    try {
      const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      const url = new URL(withProtocol);
      return url.hostname.replace(/^www\./, '');
    } catch {
      return trimmed.length > 48 ? `${trimmed.slice(0, 45)}…` : trimmed;
    }
  }
</script>

{#if links && links.cards.length > 0}
  <EditableLandingSection sectionKey="links">
    {#if variant === 'minimal'}
      <section class="ui:py-20 ui:px-4">
        <div class="ui:max-w-[1200px] ui:mx-auto">
          <h2 class="ui:text-2xl ui:font-semibold {links.description?.trim() ? 'ui:mb-3' : 'ui:mb-10'}">
            {links.heading}
          </h2>
          {#if links.description?.trim()}
            <p class="ui:text-base ui:text-[var(--landing-fg-muted)] ui:max-w-2xl ui:mb-10">
              {links.description}
            </p>
          {/if}
          <div class="ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:lg:grid-cols-3 ui:gap-6">
            {#each links.cards as card, index (index)}
              {@const IconComponent = landingPageLinkIconMap[card.icon]}
              <a
                href={card.href}
                target="_blank"
                rel="noreferrer"
                class="ui:group ui:block ui:h-full ui:no-underline ui:cursor-pointer"
                aria-label={`${card.title} — ${linkDisplayHint(card.href)} (opens in new tab)`}
              >
                <Card.Root
                  class="ui:rounded-none ui:border-[var(--landing-border)]/60 ui:shadow-none ui:h-full ui:p-0 ui:gap-0 ui:transition-colors ui:hover:border-[var(--landing-border)]"
                >
                  <Card.Content class="ui:p-8 ui:flex ui:flex-col ui:flex-1 ui:h-full">
                    <IconComponent class="ui:size-6 ui:text-[var(--landing-fg)] ui:mb-6" aria-hidden="true" />
                    <Card.Title class="ui:text-xl ui:font-normal ui:mb-3">{card.title}</Card.Title>
                    <Card.Description
                      class="ui:text-base ui:leading-relaxed ui:text-[var(--landing-fg-muted)] ui:line-clamp-3 ui:mb-6"
                    >
                      {card.description}
                    </Card.Description>
                    <div
                      class="ui:flex ui:items-center ui:gap-1.5 ui:text-sm ui:text-[var(--landing-fg-muted)] ui:mt-auto"
                      aria-hidden="true"
                    >
                      <span class="ui:truncate">{linkDisplayHint(card.href)}</span>
                      <ArrowRightIcon
                        class="ui:size-4 ui:shrink-0 ui:transition-transform ui:group-hover:translate-x-0.5"
                      />
                    </div>
                  </Card.Content>
                </Card.Root>
              </a>
            {/each}
          </div>
        </div>
      </section>
    {:else if variant === 'tech'}
      <section
        class="ui:relative ui:py-24 ui:px-6 ui:bg-[var(--landing-accent)] ui:text-[var(--landing-accent-fg)] ui:overflow-hidden"
      >
        <DotPattern class="ui:opacity-[0.08]" />
        <div class="ui:relative ui:max-w-7xl ui:mx-auto">
          <h2 class="ui:text-4xl ui:lg:text-5xl ui:font-extrabold ui:tracking-tight ui:mb-3">{links.heading}</h2>
          {#if links.description?.trim()}
            <p class="ui:text-lg ui:text-[var(--landing-accent-fg)]/80 ui:max-w-2xl ui:mb-14 ui:font-mono">
              {links.description}
            </p>
          {:else}
            <div class="ui:mb-14" aria-hidden="true"></div>
          {/if}
          <div
            class="ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:lg:grid-cols-3 ui:border ui:border-[var(--landing-accent-fg)]/20"
          >
            {#each links.cards as card, index (index)}
              {@const IconComponent = landingPageLinkIconMap[card.icon]}
              <a
                href={card.href}
                target="_blank"
                rel="noreferrer"
                class="ui:group ui:block ui:h-full ui:p-8 ui:border-r ui:border-b ui:border-[var(--landing-accent-fg)]/15 ui:transition-colors ui:hover:bg-[var(--landing-accent-fg)]/5 ui:no-underline ui:text-[var(--landing-accent-fg)] ui:cursor-pointer"
                aria-label={`${card.title} — ${linkDisplayHint(card.href)} (opens in new tab)`}
              >
                <div
                  class="ui:inline-flex ui:items-center ui:justify-center ui:size-9 ui:bg-[var(--landing-accent-fg)]/15 ui:text-[var(--landing-accent-fg)] ui:font-mono ui:font-bold ui:mb-5"
                >
                  <IconComponent class="ui:size-4 custom" aria-hidden="true" />
                </div>
                <h3 class="ui:text-lg ui:font-bold ui:tracking-tight ui:mb-2">{card.title}</h3>
                <p class="ui:text-sm ui:text-[var(--landing-accent-fg)]/70 ui:leading-relaxed ui:line-clamp-3 ui:m-0">
                  {card.description}
                </p>
              </a>
            {/each}
          </div>
        </div>
      </section>
    {:else if variant === 'studio'}
      <section class="ui:py-24 ui:px-6 ui:border-t ui:border-[var(--landing-border)] ui:bg-[var(--landing-bg)]">
        <div class="ui:max-w-[1080px] ui:mx-auto">
          <div class="ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:gap-12 ui:mb-12 ui:items-end">
            <div>
              <p class="ui:text-sm ui:text-[var(--landing-fg-muted)] ui:mb-1.5 ui:inline-flex ui:items-center ui:gap-2">
                <span class="ui:size-1.5 ui:rounded-full ui:bg-[var(--landing-accent)]"></span>
                {resolvedResourcesEyebrow}
              </p>
              <h2 class="ui:text-3xl ui:lg:text-4xl ui:font-semibold ui:tracking-tight ui:m-0">{links.heading}</h2>
            </div>
            {#if links.description?.trim()}
              <p class="ui:text-base ui:text-[var(--landing-fg-muted)] ui:leading-relaxed ui:m-0">
                {links.description}
              </p>
            {/if}
          </div>
          <div class="ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:lg:grid-cols-4 ui:gap-3">
            {#each links.cards as card, index (index)}
              {@const IconComponent = landingPageLinkIconMap[card.icon]}
              <a
                href={card.href}
                target="_blank"
                rel="noreferrer"
                class="ui:group ui:block ui:h-full ui:p-6 ui:bg-[var(--landing-card)] ui:border ui:border-[var(--landing-border)] ui:rounded-xl ui:transition-colors ui:hover:border-[var(--landing-fg)]/30 ui:hover:bg-[var(--landing-card-soft)]/30 ui:no-underline ui:cursor-pointer"
                aria-label={`${card.title} — ${linkDisplayHint(card.href)} (opens in new tab)`}
              >
                <div
                  class="ui:inline-flex ui:items-center ui:justify-center ui:size-8 ui:rounded-lg ui:bg-[var(--landing-card-soft)] ui:border ui:border-[var(--landing-border)] ui:text-[var(--landing-accent)] ui:mb-3"
                >
                  <IconComponent class="ui:size-4" aria-hidden="true" />
                </div>
                <h3 class="ui:text-sm ui:font-medium ui:tracking-tight ui:mb-1.5 ui:text-[var(--landing-fg)]">
                  {card.title}
                </h3>
                <p class="ui:text-[13px] ui:text-[var(--landing-fg-muted)] ui:leading-relaxed ui:line-clamp-3 ui:m-0">
                  {card.description}
                </p>
              </a>
            {/each}
          </div>
        </div>
      </section>
    {:else if variant === 'terminal'}
      {@const cardCount = links.cards.length}
      {@const lgColsClass =
        cardCount >= 4
          ? 'ui:lg:grid-cols-4'
          : cardCount === 3
            ? 'ui:lg:grid-cols-3'
            : cardCount === 2
              ? 'ui:lg:grid-cols-2'
              : 'ui:lg:grid-cols-1'}
      {@const mdColsClass = cardCount === 1 ? 'ui:md:grid-cols-1' : 'ui:md:grid-cols-2'}
      <section
        class="ui:py-24 ui:px-6"
        style="border-top: 1px solid #1c1f28; background:
        radial-gradient(ellipse 60% 100% at 50% 0%, color-mix(in oklab, var(--landing-accent) 6%, transparent) 0%, transparent 60%),
        #06070a;"
      >
        <div class="ui:max-w-[1120px] ui:mx-auto">
          <p
            class="ui:font-mono ui:text-[11px] ui:tracking-[0.12em] ui:uppercase ui:mb-3 ui:inline-flex ui:items-center ui:gap-2"
            style="color: var(--landing-accent);"
          >
            <span
              class="ui:size-1.5 ui:rounded-full"
              style="background: var(--landing-accent); box-shadow: 0 0 12px var(--landing-accent);"
            ></span>
            {resolvedResourcesEyebrow}
          </p>
          <h2
            class="ui:text-[40px] ui:font-semibold ui:tracking-tight ui:m-0 ui:mb-10"
            style="color: #e9eaed; letter-spacing: -0.025em; line-height: 1.08;"
          >
            {links.heading}
          </h2>
          <div
            class="ui:grid ui:grid-cols-1 {mdColsClass} {lgColsClass} ui:overflow-hidden ui:rounded-[14px] ui:gap-[1px]"
            style="border: 1px solid #1c1f28; background: #1c1f28;"
          >
            {#each links.cards as card, index (index)}
              {@const IconComponent = landingPageLinkIconMap[card.icon]}
              <a
                href={card.href}
                target="_blank"
                rel="noreferrer"
                class="ui:flex ui:flex-col ui:gap-3 ui:p-7 ui:no-underline ui:h-full ui:transition-colors ui:cursor-pointer"
                style="background: #0f1218; color: #e9eaed;"
                onmouseenter={(e) => (e.currentTarget.style.background = '#14171f')}
                onmouseleave={(e) => (e.currentTarget.style.background = '#0f1218')}
                aria-label={`${card.title} — ${linkDisplayHint(card.href)} (opens in new tab)`}
              >
                <div
                  class="ui:inline-flex ui:items-center ui:justify-center ui:size-9 ui:rounded-lg"
                  style="border: 1px solid #262a35; background: #14171f; color: var(--landing-accent);"
                >
                  <IconComponent class="ui:size-4" aria-hidden="true" />
                </div>
                <h3 class="ui:text-sm ui:font-semibold ui:m-0" style="color: #e9eaed;">
                  {card.title}
                </h3>
                <p class="ui:text-[13px] ui:m-0 ui:line-clamp-3" style="color: #9da1ab; line-height: 1.5;">
                  {card.description}
                </p>
              </a>
            {/each}
          </div>
        </div>
      </section>
    {:else if variant === 'corporate'}
      <section
        class="ui:py-20 ui:px-6 ui:bg-[var(--landing-card-soft)]/30 ui:border-t ui:border-b ui:border-[var(--landing-border)]"
      >
        <div class="ui:max-w-[1120px] ui:mx-auto">
          <p class="ui:text-xs ui:font-semibold ui:tracking-widest ui:uppercase ui:text-[var(--landing-fg)] ui:mb-3">
            {resolvedResourcesEyebrow}
          </p>
          <h2 class="ui:text-3xl ui:font-semibold ui:tracking-tight ui:m-0 ui:mb-10">{links.heading}</h2>
          <div
            class="ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:border-t ui:border-l ui:border-[var(--landing-border)]"
          >
            {#each links.cards as card, index (index)}
              {@const IconComponent = landingPageLinkIconMap[card.icon]}
              <a
                href={card.href}
                target="_blank"
                rel="noreferrer"
                class="ui:flex ui:gap-5 ui:items-start ui:p-7 ui:border-r ui:border-b ui:border-[var(--landing-border)] ui:bg-[var(--landing-bg)] ui:transition-colors ui:hover:bg-[var(--landing-card-soft)]/40 ui:no-underline ui:h-full ui:cursor-pointer"
                aria-label={`${card.title} — ${linkDisplayHint(card.href)} (opens in new tab)`}
              >
                <div
                  class="ui:inline-flex ui:items-center ui:justify-center ui:size-9 ui:bg-[var(--landing-fg)] ui:text-[var(--landing-bg)] ui:flex-shrink-0"
                >
                  <IconComponent class="ui:size-4" aria-hidden="true" />
                </div>
                <div class="ui:min-w-0">
                  <h3 class="ui:text-base ui:font-semibold ui:tracking-tight ui:mb-1.5 ui:m-0">{card.title}</h3>
                  <p class="ui:text-sm ui:text-[var(--landing-fg-muted)] ui:leading-relaxed ui:line-clamp-3 ui:m-0">
                    {card.description}
                  </p>
                </div>
              </a>
            {/each}
          </div>
        </div>
      </section>
    {:else if variant === 'saas'}
      <section class="ui:py-20 ui:px-6 ui:bg-[var(--landing-card-soft)]/40">
        <div class="ui:max-w-[1180px] ui:mx-auto">
          <div class="ui:text-center ui:max-w-xl ui:mx-auto ui:mb-12">
            <p
              class="ui:text-xs ui:font-semibold ui:tracking-widest ui:uppercase ui:text-[var(--landing-accent)] ui:mb-3"
            >
              {resolvedResourcesEyebrow}
            </p>
            <h2 class="ui:text-3xl ui:md:text-4xl ui:font-bold ui:tracking-tight ui:m-0">
              {links.heading}
            </h2>
            {#if links.description?.trim()}
              <p class="ui:text-base ui:text-[var(--landing-fg-muted)] ui:mt-3 ui:leading-relaxed">
                {links.description}
              </p>
            {/if}
          </div>

          <div
            class="ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:lg:grid-cols-3 ui:gap-[1px] ui:bg-[var(--landing-border)] ui:border ui:border-[var(--landing-border)]"
          >
            {#each links.cards as card, index (index)}
              {@const IconComponent = landingPageLinkIconMap[card.icon]}
              <a
                href={card.href}
                target="_blank"
                rel="noreferrer"
                class="ui:bg-[var(--landing-bg)] ui:p-7 ui:flex ui:flex-col ui:items-center ui:text-center ui:gap-3 ui:transition-colors ui:hover:bg-[var(--landing-card-soft)]/40 ui:no-underline ui:h-full ui:cursor-pointer"
                aria-label={`${card.title} — ${linkDisplayHint(card.href)} (opens in new tab)`}
              >
                <div
                  class="ui:inline-flex ui:items-center ui:justify-center ui:size-10 ui:rounded-xl ui:bg-[var(--landing-accent)]/10 ui:text-[var(--landing-accent)] ui:mb-1"
                >
                  <IconComponent class="ui:size-5" aria-hidden="true" />
                </div>
                <h3 class="ui:text-base ui:font-bold ui:tracking-tight ui:m-0">{card.title}</h3>
                <p class="ui:text-sm ui:text-[var(--landing-fg-muted)] ui:leading-relaxed ui:line-clamp-3 ui:m-0">
                  {card.description}
                </p>
              </a>
            {/each}
          </div>
        </div>
      </section>
    {:else if variant === 'vibrant'}
      <section class="ui:py-24 ui:md:py-28 ui:px-6 ui:bg-[var(--landing-bg)]">
        <div class="ui:max-w-[1320px] ui:mx-auto">
          <h2
            class="ui:text-4xl ui:md:text-5xl ui:font-medium ui:tracking-tight ui:text-center ui:m-0 ui:mb-3 ui:text-[var(--landing-fg)]"
            style="letter-spacing: -0.025em; line-height: 1.1;"
          >
            {links.heading}
          </h2>
          {#if links.description?.trim()}
            <p class="ui:text-lg ui:text-[var(--landing-fg-muted)] ui:text-center ui:max-w-xl ui:mx-auto ui:mb-14">
              {links.description}
            </p>
          {:else}
            <div class="ui:mb-14" aria-hidden="true"></div>
          {/if}
          <div class="ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:lg:grid-cols-3 ui:gap-5">
            {#each links.cards as card, index (index)}
              {@const IconComponent = landingPageLinkIconMap[card.icon]}
              <a
                href={card.href}
                target="_blank"
                rel="noreferrer"
                class="ui:group ui:flex ui:flex-col ui:h-full ui:p-8 ui:rounded-[20px] ui:bg-[var(--landing-card-soft)]/60 ui:no-underline ui:transition-colors ui:hover:bg-[var(--landing-card-soft)] ui:cursor-pointer"
                aria-label={`${card.title} — ${linkDisplayHint(card.href)} (opens in new tab)`}
              >
                <div
                  class="ui:inline-flex ui:items-center ui:justify-center ui:size-11 ui:rounded-xl ui:bg-[var(--landing-accent)]/10 ui:text-[var(--landing-accent)] ui:mb-5"
                >
                  <IconComponent class="ui:size-5" aria-hidden="true" />
                </div>
                <h3 class="ui:text-lg ui:font-semibold ui:tracking-tight ui:m-0 ui:mb-2 ui:text-[var(--landing-fg)]">
                  {card.title}
                </h3>
                <p
                  class="ui:text-[15px] ui:text-[var(--landing-fg-muted)] ui:leading-relaxed ui:line-clamp-3 ui:m-0 ui:mb-6"
                >
                  {card.description}
                </p>
                <span
                  class="ui:mt-auto ui:inline-flex ui:items-center ui:gap-1 ui:text-sm ui:font-medium ui:text-[var(--landing-accent)]"
                  aria-hidden="true"
                >
                  {labels?.learnMoreLabel ?? 'Learn more'}
                  <ArrowRightIcon class="ui:size-3.5 ui:transition-transform ui:group-hover:translate-x-0.5" />
                </span>
              </a>
            {/each}
          </div>
        </div>
      </section>
    {:else if variant === 'editorial'}
      {@const cardCount = links.cards.length}
      {@const lgColsClass =
        cardCount >= 4
          ? 'ui:lg:grid-cols-4'
          : cardCount === 3
            ? 'ui:lg:grid-cols-3'
            : cardCount === 2
              ? 'ui:lg:grid-cols-2'
              : 'ui:lg:grid-cols-1'}
      <section class="ui:py-24 ui:md:py-28 ui:px-6 ui:bg-[#f4f3ed]">
        <div class="ui:max-w-[1240px] ui:mx-auto">
          <div class="ui:flex ui:flex-col ui:md:flex-row ui:md:items-end ui:justify-between ui:gap-6 ui:mb-10">
            <div>
              <p class="ui:text-[13px] ui:text-[#76746c] ui:mb-2">{resolvedResourcesEyebrow}</p>
              <h2
                class="ui:text-3xl ui:md:text-[38px] ui:font-medium ui:tracking-tight ui:m-0 ui:text-[#1a1a1a] ui:leading-[1.1]"
              >
                {links.heading}
              </h2>
              {#if links.description?.trim()}
                <p class="ui:text-base ui:text-[#76746c] ui:mt-3 ui:max-w-xl ui:leading-relaxed">
                  {links.description}
                </p>
              {/if}
            </div>
          </div>
          <div class="ui:grid ui:grid-cols-1 ui:md:grid-cols-2 {lgColsClass} ui:gap-4">
            {#each links.cards as card, index (index)}
              {@const IconComponent = landingPageLinkIconMap[card.icon]}
              <a
                href={card.href}
                target="_blank"
                rel="noreferrer"
                class="ui:group ui:flex ui:flex-col ui:h-full ui:p-7 ui:rounded-lg ui:bg-[#ecebe5] ui:no-underline ui:transition-colors ui:hover:bg-[#e2e1d9] ui:cursor-pointer"
                aria-label={`${card.title} — ${linkDisplayHint(card.href)} (opens in new tab)`}
              >
                <div
                  class="ui:inline-flex ui:items-center ui:justify-center ui:size-9 ui:rounded-lg ui:bg-[#fafaf5] ui:border ui:border-[#d9d8d0] ui:text-[#c25237] ui:mb-5"
                >
                  <IconComponent class="ui:size-4" aria-hidden="true" />
                </div>
                <h3 class="ui:text-base ui:font-semibold ui:tracking-tight ui:m-0 ui:mb-1.5 ui:text-[#1a1a1a]">
                  {card.title}
                </h3>
                <p class="ui:text-[13.5px] ui:text-[#76746c] ui:leading-relaxed ui:line-clamp-3 ui:m-0 ui:mb-5">
                  {card.description}
                </p>
                <span
                  class="ui:mt-auto ui:inline-flex ui:items-center ui:gap-1 ui:text-[13.5px] ui:font-medium ui:text-[#c25237]"
                  aria-hidden="true"
                >
                  {labels?.learnMoreLabel ?? 'Visit'}
                  <ArrowRightIcon class="ui:size-3.5 ui:transition-transform ui:group-hover:translate-x-0.5" />
                </span>
              </a>
            {/each}
          </div>
        </div>
      </section>
    {:else if variant === 'bold'}
      <section class="ui:relative ui:py-20 ui:px-6 ui:bg-[var(--landing-bg)] ui:overflow-hidden">
        <DotPattern class="ui:opacity-[0.10]" />
        <div class="ui:relative ui:max-w-7xl ui:mx-auto">
          <h2 class="ui:text-4xl ui:font-black ui:tracking-tight ui:mb-3">{links.heading}</h2>
          {#if links.description?.trim()}
            <p class="ui:text-lg ui:text-[var(--landing-fg-muted)] ui:max-w-2xl ui:mb-12">{links.description}</p>
          {:else}
            <div class="ui:mb-12" aria-hidden="true"></div>
          {/if}
          <div class="ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:lg:grid-cols-3 ui:gap-8">
            {#each links.cards as card, index (index)}
              {@const IconComponent = landingPageLinkIconMap[card.icon]}
              {@const visitLabel = links.boldVisitLabel?.trim()}
              <a
                href={card.href}
                target="_blank"
                rel="noreferrer"
                class="ui:group ui:block ui:h-full ui:no-underline ui:cursor-pointer"
                aria-label={`${card.title}${visitLabel ? ` — ${visitLabel}` : ''} (opens in new tab)`}
              >
                <Card.Root
                  class="ui:relative ui:overflow-hidden ui:rounded-3xl ui:bg-[var(--landing-bg)] ui:border-[var(--landing-border)]/50 ui:p-8 ui:h-full ui:flex ui:flex-col ui:transition-all ui:duration-300 ui:hover:shadow-xl ui:hover:shadow-primary/5"
                >
                  <BorderBeam
                    size={120}
                    duration={8}
                    colorFrom="var(--landing-accent)"
                    colorTo="color-mix(in oklab, var(--landing-accent) 65%, white)"
                  />
                  <div
                    class="ui:inline-flex ui:items-center ui:justify-center ui:size-12 ui:rounded-2xl ui:bg-[var(--landing-accent)]/10 ui:text-[var(--landing-accent)] ui:mb-6"
                  >
                    <IconComponent class="ui:size-6" aria-hidden="true" />
                  </div>
                  <Card.Title class="ui:text-2xl ui:font-bold ui:tracking-tight ui:mb-3">{card.title}</Card.Title>
                  <Card.Description class="ui:text-base ui:text-[var(--landing-fg-muted)] ui:line-clamp-3 ui:mb-6">
                    {card.description}
                  </Card.Description>
                  <div class="ui:mt-auto">
                    <span
                      class="ui:inline-flex ui:items-center ui:gap-1.5 ui:text-sm ui:font-bold ui:text-[var(--landing-fg)] ui:bg-[var(--landing-card-soft)] ui:px-3 ui:py-1.5 ui:rounded-lg ui:transition-colors ui:group-hover:bg-[var(--landing-accent)] ui:group-hover:text-[var(--landing-accent-fg)]"
                      aria-hidden="true"
                    >
                      {#if visitLabel}
                        {visitLabel}
                      {/if}
                      <ArrowRightIcon class="ui:size-3.5" />
                    </span>
                  </div>
                </Card.Root>
              </a>
            {/each}
          </div>
        </div>
      </section>
    {:else}
      <section class="ui:py-10 ui:px-6 ui:lg:px-8 ui:max-w-7xl ui:mx-auto">
        <div class="ui:text-center">
          <h2 class="ui:text-3xl ui:font-bold ui:text-[var(--landing-fg)]">{links.heading}</h2>
          <div class="ui:mt-6 ui:h-px ui:w-24 ui:bg-[var(--landing-border)] ui:mx-auto"></div>
          {#if links.description?.trim()}
            <p class="ui:mt-6 ui:text-center ui:text-[var(--landing-fg-muted)] ui:max-w-2xl ui:mx-auto">
              {links.description}
            </p>
          {/if}
        </div>
        <div
          class="ui:mt-10 ui:grid ui:grid-cols-1 ui:sm:grid-cols-2 ui:lg:grid-cols-3 ui:gap-8 ui:justify-items-center"
        >
          {#each links.cards as card, index (index)}
            {@const IconComponent = landingPageLinkIconMap[card.icon]}
            {@const learnMoreLabel = links.classicLearnMoreLabel?.trim()}
            <a
              href={card.href}
              target="_blank"
              rel="noreferrer"
              class="ui:group ui:block ui:h-full ui:no-underline ui:cursor-pointer"
              aria-label={`${card.title}${learnMoreLabel ? ` — ${learnMoreLabel}` : ''} (opens in new tab)`}
            >
              <Card.Root
                class="ui:w-full ui:rounded-xl ui:border-[var(--landing-border)] ui:bg-[var(--landing-bg)] ui:p-6 ui:h-full ui:flex ui:flex-col ui:hover:shadow-md ui:transition-shadow"
              >
                <div
                  class="ui:flex ui:items-center ui:justify-center ui:size-12 ui:rounded-full ui:bg-[var(--landing-card-soft)] ui:mb-4"
                >
                  <IconComponent class="ui:size-5 ui:text-[var(--landing-fg)]" aria-hidden="true" />
                </div>
                <Card.Title class="ui:text-xl ui:font-semibold ui:mb-2">{card.title}</Card.Title>
                <Card.Description class="ui:text-sm ui:text-[var(--landing-fg-muted)] ui:line-clamp-3 ui:mb-4">
                  {card.description}
                </Card.Description>
                <div
                  class="ui:text-sm ui:font-medium ui:text-[var(--landing-fg)] ui:border-t ui:border-[var(--landing-border)]/60 ui:pt-3 ui:mt-auto ui:flex ui:items-center ui:gap-1.5 ui:group-hover:text-[var(--landing-accent)] ui:transition-colors"
                  aria-hidden="true"
                >
                  {#if learnMoreLabel}
                    <span>{learnMoreLabel}</span>
                  {/if}
                  <ArrowRightIcon class="ui:size-4" />
                </div>
              </Card.Root>
            </a>
          {/each}
        </div>
      </section>
    {/if}
  </EditableLandingSection>
{/if}
