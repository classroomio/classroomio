<script lang="ts">
  import type { LandingPageLinks, OrgLandingPageTheme } from './types';
  import { landingPageLinkIconMap } from './landing-page-link-icons';
  import { BlurFade } from '../animation/blurfade';
  import { BorderBeam } from '../animation/border-beam';
  import { DotPattern } from '../animation/dot-pattern';
  import * as Card from '../../base/card';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import EditableLandingSection from './editable-section.svelte';

  let { links, variant = 'minimal' }: { links?: LandingPageLinks; variant?: OrgLandingPageTheme } = $props();

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
          <BlurFade delay={0} once={true}>
            <h2 class="ui:text-2xl ui:font-semibold {links.description?.trim() ? 'ui:mb-3' : 'ui:mb-10'}">
              {links.heading}
            </h2>
          </BlurFade>
          {#if links.description?.trim()}
            <BlurFade delay={0.12} once={true}>
              <p class="ui:text-base ui:text-muted-foreground ui:max-w-2xl ui:mb-10">
                {links.description}
              </p>
            </BlurFade>
          {/if}
          <div class="ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:lg:grid-cols-3 ui:gap-6">
            {#each links.cards as card, index (index)}
              {@const IconComponent = landingPageLinkIconMap[card.icon]}
              <BlurFade delay={0.1 * index} once={true}>
                <a
                  href={card.href}
                  target="_blank"
                  rel="noreferrer"
                  class="ui:group ui:block ui:h-full ui:no-underline"
                  aria-label={`${card.title} — ${linkDisplayHint(card.href)} (opens in new tab)`}
                >
                  <Card.Root
                    class="ui:rounded-none ui:border-border/60 ui:shadow-none ui:h-full ui:p-0 ui:gap-0 ui:transition-colors ui:hover:border-border"
                  >
                    <Card.Content class="ui:p-8 ui:flex ui:flex-col ui:flex-1 ui:h-full">
                      <IconComponent class="ui:size-6 ui:text-foreground ui:mb-6" aria-hidden="true" />
                      <Card.Title class="ui:text-xl ui:font-normal ui:mb-3">{card.title}</Card.Title>
                      <Card.Description
                        class="ui:text-base ui:leading-relaxed ui:text-muted-foreground ui:line-clamp-3 ui:mb-6"
                      >
                        {card.description}
                      </Card.Description>
                      <div
                        class="ui:flex ui:items-center ui:gap-1.5 ui:text-sm ui:text-muted-foreground ui:mt-auto"
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
              </BlurFade>
            {/each}
          </div>
        </div>
      </section>
    {:else if variant === 'tech'}
      <section class="ui:relative ui:py-24 ui:px-6 ui:bg-primary ui:text-primary-foreground ui:overflow-hidden">
        <DotPattern class="ui:opacity-[0.08]" />
        <div class="ui:relative ui:max-w-7xl ui:mx-auto">
          <BlurFade delay={0} once={true}>
            <h2 class="ui:text-4xl ui:lg:text-5xl ui:font-extrabold ui:tracking-tight ui:mb-3">{links.heading}</h2>
          </BlurFade>
          {#if links.description?.trim()}
            <BlurFade delay={0.12} once={true}>
              <p class="ui:text-lg ui:text-primary-foreground/80 ui:max-w-2xl ui:mb-14 ui:font-mono">
                {links.description}
              </p>
            </BlurFade>
          {:else}
            <div class="ui:mb-14" aria-hidden="true"></div>
          {/if}
          <div
            class="ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:lg:grid-cols-3 ui:border ui:border-primary-foreground/20"
          >
            {#each links.cards as card, index (index)}
              {@const IconComponent = landingPageLinkIconMap[card.icon]}
              <BlurFade delay={0.08 * index} once={true}>
                <a
                  href={card.href}
                  target="_blank"
                  rel="noreferrer"
                  class="ui:group ui:block ui:h-full ui:p-8 ui:border-r ui:border-b ui:border-primary-foreground/15 ui:transition-colors ui:hover:bg-primary-foreground/5 ui:no-underline ui:text-primary-foreground"
                  aria-label={`${card.title} — ${linkDisplayHint(card.href)} (opens in new tab)`}
                >
                  <div
                    class="ui:inline-flex ui:items-center ui:justify-center ui:size-9 ui:bg-primary-foreground/15 ui:text-primary-foreground ui:font-mono ui:font-bold ui:mb-5"
                  >
                    <IconComponent class="ui:size-4 custom" aria-hidden="true" />
                  </div>
                  <h3 class="ui:text-lg ui:font-bold ui:tracking-tight ui:mb-2">{card.title}</h3>
                  <p class="ui:text-sm ui:text-primary-foreground/70 ui:leading-relaxed ui:line-clamp-3 ui:m-0">
                    {card.description}
                  </p>
                </a>
              </BlurFade>
            {/each}
          </div>
        </div>
      </section>
    {:else if variant === 'studio'}
      <section class="ui:py-24 ui:px-6 ui:border-t ui:border-border ui:bg-background">
        <div class="ui:max-w-[1080px] ui:mx-auto">
          <div class="ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:gap-12 ui:mb-12 ui:items-end">
            <BlurFade delay={0} once={true}>
              <div>
                <p class="ui:text-sm ui:text-muted-foreground ui:mb-1.5 ui:inline-flex ui:items-center ui:gap-2">
                  <span class="ui:size-1.5 ui:rounded-full ui:bg-primary"></span>
                  Resources
                </p>
                <h2 class="ui:text-3xl ui:lg:text-4xl ui:font-semibold ui:tracking-tight ui:m-0">{links.heading}</h2>
              </div>
            </BlurFade>
            {#if links.description?.trim()}
              <BlurFade delay={0.1} once={true}>
                <p class="ui:text-base ui:text-muted-foreground ui:leading-relaxed ui:m-0">
                  {links.description}
                </p>
              </BlurFade>
            {/if}
          </div>
          <div class="ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:lg:grid-cols-4 ui:gap-3">
            {#each links.cards as card, index (index)}
              {@const IconComponent = landingPageLinkIconMap[card.icon]}
              <BlurFade delay={0.06 * index} once={true}>
                <a
                  href={card.href}
                  target="_blank"
                  rel="noreferrer"
                  class="ui:group ui:block ui:h-full ui:p-6 ui:bg-card ui:border ui:border-border ui:rounded-xl ui:transition-colors ui:hover:border-foreground/30 ui:hover:bg-muted/30 ui:no-underline"
                  aria-label={`${card.title} — ${linkDisplayHint(card.href)} (opens in new tab)`}
                >
                  <div
                    class="ui:inline-flex ui:items-center ui:justify-center ui:size-8 ui:rounded-lg ui:bg-muted ui:border ui:border-border ui:text-primary ui:mb-3"
                  >
                    <IconComponent class="ui:size-4" aria-hidden="true" />
                  </div>
                  <h3 class="ui:text-sm ui:font-medium ui:tracking-tight ui:mb-1.5 ui:text-foreground">{card.title}</h3>
                  <p class="ui:text-[13px] ui:text-muted-foreground ui:leading-relaxed ui:line-clamp-3 ui:m-0">
                    {card.description}
                  </p>
                </a>
              </BlurFade>
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
        radial-gradient(ellipse 60% 100% at 50% 0%, color-mix(in oklab, var(--primary) 6%, transparent) 0%, transparent 60%),
        #06070a;"
      >
        <div class="ui:max-w-[1120px] ui:mx-auto">
          <BlurFade delay={0} once={true}>
            <p
              class="ui:font-mono ui:text-[11px] ui:tracking-[0.12em] ui:uppercase ui:mb-3 ui:inline-flex ui:items-center ui:gap-2"
              style="color: var(--primary);"
            >
              <span
                class="ui:size-1.5 ui:rounded-full"
                style="background: var(--primary); box-shadow: 0 0 12px var(--primary);"
              ></span>
              Resources
            </p>
          </BlurFade>
          <BlurFade delay={0.08} once={true}>
            <h2
              class="ui:text-[40px] ui:font-semibold ui:tracking-tight ui:m-0 ui:mb-10"
              style="color: #e9eaed; letter-spacing: -0.025em; line-height: 1.08;"
            >
              {links.heading}
            </h2>
          </BlurFade>
          <div
            class="ui:grid ui:grid-cols-1 {mdColsClass} {lgColsClass} ui:overflow-hidden ui:rounded-[14px] ui:gap-[1px]"
            style="border: 1px solid #1c1f28; background: #1c1f28;"
          >
            {#each links.cards as card, index (index)}
              {@const IconComponent = landingPageLinkIconMap[card.icon]}
              <BlurFade delay={0.06 * index} once={true}>
                <a
                  href={card.href}
                  target="_blank"
                  rel="noreferrer"
                  class="ui:flex ui:flex-col ui:gap-3 ui:p-7 ui:no-underline ui:h-full ui:transition-colors"
                  style="background: #0f1218; color: #e9eaed;"
                  onmouseenter={(e) => (e.currentTarget.style.background = '#14171f')}
                  onmouseleave={(e) => (e.currentTarget.style.background = '#0f1218')}
                  aria-label={`${card.title} — ${linkDisplayHint(card.href)} (opens in new tab)`}
                >
                  <div
                    class="ui:inline-flex ui:items-center ui:justify-center ui:size-9 ui:rounded-lg"
                    style="border: 1px solid #262a35; background: #14171f; color: var(--primary);"
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
              </BlurFade>
            {/each}
          </div>
        </div>
      </section>
    {:else if variant === 'corporate'}
      <section class="ui:py-20 ui:px-6 ui:bg-muted/30 ui:border-t ui:border-b ui:border-border">
        <div class="ui:max-w-[1120px] ui:mx-auto">
          <BlurFade delay={0} once={true}>
            <p class="ui:text-xs ui:font-semibold ui:tracking-widest ui:uppercase ui:text-foreground ui:mb-3">
              Resources
            </p>
          </BlurFade>
          <BlurFade delay={0.1} once={true}>
            <h2 class="ui:text-3xl ui:font-semibold ui:tracking-tight ui:m-0 ui:mb-10">{links.heading}</h2>
          </BlurFade>
          <div class="ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:border-t ui:border-l ui:border-border">
            {#each links.cards as card, index (index)}
              {@const IconComponent = landingPageLinkIconMap[card.icon]}
              <BlurFade delay={0.06 * index} once={true}>
                <a
                  href={card.href}
                  target="_blank"
                  rel="noreferrer"
                  class="ui:flex ui:gap-5 ui:items-start ui:p-7 ui:border-r ui:border-b ui:border-border ui:bg-background ui:transition-colors ui:hover:bg-muted/40 ui:no-underline ui:h-full"
                  aria-label={`${card.title} — ${linkDisplayHint(card.href)} (opens in new tab)`}
                >
                  <div
                    class="ui:inline-flex ui:items-center ui:justify-center ui:size-9 ui:bg-foreground ui:text-background ui:flex-shrink-0"
                  >
                    <IconComponent class="ui:size-4" aria-hidden="true" />
                  </div>
                  <div class="ui:min-w-0">
                    <h3 class="ui:text-base ui:font-semibold ui:tracking-tight ui:mb-1.5 ui:m-0">{card.title}</h3>
                    <p class="ui:text-sm ui:text-muted-foreground ui:leading-relaxed ui:line-clamp-3 ui:m-0">
                      {card.description}
                    </p>
                  </div>
                </a>
              </BlurFade>
            {/each}
          </div>
        </div>
      </section>
    {:else if variant === 'saas'}
      <section class="ui:py-20 ui:px-6 ui:bg-muted/40">
        <div class="ui:max-w-[1180px] ui:mx-auto">
          <div class="ui:text-center ui:max-w-xl ui:mx-auto ui:mb-12">
            <BlurFade delay={0} once={true}>
              <p class="ui:text-xs ui:font-semibold ui:tracking-widest ui:uppercase ui:text-primary ui:mb-3">
                Resources
              </p>
            </BlurFade>
            <BlurFade delay={0.1} once={true}>
              <h2 class="ui:text-3xl ui:md:text-4xl ui:font-bold ui:tracking-tight ui:m-0">
                {links.heading}
              </h2>
            </BlurFade>
            {#if links.description?.trim()}
              <BlurFade delay={0.18} once={true}>
                <p class="ui:text-base ui:text-muted-foreground ui:mt-3 ui:leading-relaxed">
                  {links.description}
                </p>
              </BlurFade>
            {/if}
          </div>

          <div
            class="ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:lg:grid-cols-3 ui:gap-[1px] ui:bg-border ui:border ui:border-border"
          >
            {#each links.cards as card, index (index)}
              {@const IconComponent = landingPageLinkIconMap[card.icon]}
              <BlurFade delay={0.08 * index} once={true}>
                <a
                  href={card.href}
                  target="_blank"
                  rel="noreferrer"
                  class="ui:bg-background ui:p-7 ui:flex ui:flex-col ui:items-center ui:text-center ui:gap-3 ui:transition-colors ui:hover:bg-muted/40 ui:no-underline ui:h-full"
                  aria-label={`${card.title} — ${linkDisplayHint(card.href)} (opens in new tab)`}
                >
                  <div
                    class="ui:inline-flex ui:items-center ui:justify-center ui:size-10 ui:rounded-xl ui:bg-primary/10 ui:text-primary ui:mb-1"
                  >
                    <IconComponent class="ui:size-5" aria-hidden="true" />
                  </div>
                  <h3 class="ui:text-base ui:font-bold ui:tracking-tight ui:m-0">{card.title}</h3>
                  <p class="ui:text-sm ui:text-muted-foreground ui:leading-relaxed ui:line-clamp-3 ui:m-0">
                    {card.description}
                  </p>
                </a>
              </BlurFade>
            {/each}
          </div>
        </div>
      </section>
    {:else if variant === 'bold'}
      <section class="ui:relative ui:py-20 ui:px-6 ui:bg-background ui:overflow-hidden">
        <DotPattern class="ui:opacity-[0.10]" />
        <div class="ui:relative ui:max-w-7xl ui:mx-auto">
          <BlurFade delay={0} once={true}>
            <h2 class="ui:text-4xl ui:font-black ui:tracking-tight ui:mb-3">{links.heading}</h2>
          </BlurFade>
          {#if links.description?.trim()}
            <BlurFade delay={0.12} once={true}>
              <p class="ui:text-lg ui:text-muted-foreground ui:max-w-2xl ui:mb-12">{links.description}</p>
            </BlurFade>
          {:else}
            <div class="ui:mb-12" aria-hidden="true"></div>
          {/if}
          <div class="ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:lg:grid-cols-3 ui:gap-8">
            {#each links.cards as card, index (index)}
              {@const IconComponent = landingPageLinkIconMap[card.icon]}
              {@const visitLabel = links.boldVisitLabel?.trim()}
              <BlurFade delay={0.1 * index} once={true}>
                <a
                  href={card.href}
                  target="_blank"
                  rel="noreferrer"
                  class="ui:group ui:block ui:h-full ui:no-underline"
                  aria-label={`${card.title}${visitLabel ? ` — ${visitLabel}` : ''} (opens in new tab)`}
                >
                  <Card.Root
                    class="ui:relative ui:overflow-hidden ui:rounded-3xl ui:bg-background ui:border-border/50 ui:p-8 ui:h-full ui:flex ui:flex-col ui:transition-all ui:duration-300 ui:hover:shadow-xl ui:hover:shadow-primary/5"
                  >
                    <BorderBeam
                      size={120}
                      duration={8}
                      colorFrom="var(--primary)"
                      colorTo="color-mix(in oklab, var(--primary) 65%, white)"
                    />
                    <div
                      class="ui:inline-flex ui:items-center ui:justify-center ui:size-12 ui:rounded-2xl ui:bg-primary/10 ui:text-primary ui:mb-6"
                    >
                      <IconComponent class="ui:size-6" aria-hidden="true" />
                    </div>
                    <Card.Title class="ui:text-2xl ui:font-bold ui:tracking-tight ui:mb-3">{card.title}</Card.Title>
                    <Card.Description class="ui:text-base ui:text-muted-foreground ui:line-clamp-3 ui:mb-6">
                      {card.description}
                    </Card.Description>
                    <div class="ui:mt-auto">
                      <span
                        class="ui:inline-flex ui:items-center ui:gap-1.5 ui:text-sm ui:font-bold ui:text-foreground ui:bg-muted ui:px-3 ui:py-1.5 ui:rounded-lg ui:transition-colors ui:group-hover:bg-primary ui:group-hover:text-primary-foreground"
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
              </BlurFade>
            {/each}
          </div>
        </div>
      </section>
    {:else}
      <section class="ui:py-10 ui:px-6 ui:lg:px-8 ui:max-w-7xl ui:mx-auto">
        <div class="ui:text-center">
          <BlurFade delay={0} once={true}>
            <h2 class="ui:text-3xl ui:font-bold ui:text-foreground">{links.heading}</h2>
          </BlurFade>
          <BlurFade delay={0.15} once={true}>
            <div class="ui:mt-6 ui:h-px ui:w-24 ui:bg-border ui:mx-auto"></div>
          </BlurFade>
          {#if links.description?.trim()}
            <BlurFade delay={0.22} once={true}>
              <p class="ui:mt-6 ui:text-center ui:text-muted-foreground ui:max-w-2xl ui:mx-auto">
                {links.description}
              </p>
            </BlurFade>
          {/if}
        </div>
        <div
          class="ui:mt-10 ui:grid ui:grid-cols-1 ui:sm:grid-cols-2 ui:lg:grid-cols-3 ui:gap-8 ui:justify-items-center"
        >
          {#each links.cards as card, index (index)}
            {@const IconComponent = landingPageLinkIconMap[card.icon]}
            {@const learnMoreLabel = links.classicLearnMoreLabel?.trim()}
            <BlurFade delay={0.1 * index} once={true} class="ui:w-full ui:max-w-md">
              <a
                href={card.href}
                target="_blank"
                rel="noreferrer"
                class="ui:group ui:block ui:h-full ui:no-underline"
                aria-label={`${card.title}${learnMoreLabel ? ` — ${learnMoreLabel}` : ''} (opens in new tab)`}
              >
                <Card.Root
                  class="ui:w-full ui:rounded-xl ui:border-border ui:bg-background ui:p-6 ui:h-full ui:flex ui:flex-col ui:hover:shadow-md ui:transition-shadow"
                >
                  <div class="ui:flex ui:items-center ui:justify-center ui:size-12 ui:rounded-full ui:bg-muted ui:mb-4">
                    <IconComponent class="ui:size-5 ui:text-foreground" aria-hidden="true" />
                  </div>
                  <Card.Title class="ui:text-xl ui:font-semibold ui:mb-2">{card.title}</Card.Title>
                  <Card.Description class="ui:text-sm ui:text-muted-foreground ui:line-clamp-3 ui:mb-4">
                    {card.description}
                  </Card.Description>
                  <div
                    class="ui:text-sm ui:font-medium ui:text-foreground ui:border-t ui:border-border/60 ui:pt-3 ui:mt-auto ui:flex ui:items-center ui:gap-1.5 ui:group-hover:text-primary ui:transition-colors"
                    aria-hidden="true"
                  >
                    {#if learnMoreLabel}
                      <span>{learnMoreLabel}</span>
                    {/if}
                    <ArrowRightIcon class="ui:size-4" />
                  </div>
                </Card.Root>
              </a>
            </BlurFade>
          {/each}
        </div>
      </section>
    {/if}
  </EditableLandingSection>
{/if}
