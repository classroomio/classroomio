<script lang="ts">
  import type { OrgLandingPageProps } from '../types';
  import type { Snippet } from 'svelte';
  import SecondaryActionButton from '../secondary-action-button.svelte';
  import { Button } from '../../../base/button';
  import { BlurFade } from '../../animation/blurfade';
  import EditableLandingSection from '../editable-section.svelte';

  interface Props {
    orgName: OrgLandingPageProps['orgName'];
    hero: OrgLandingPageProps['hero'];
    navigation: Snippet;
  }

  let { orgName, hero, navigation }: Props = $props();

  const stats = $derived(hero.stats ?? []);
</script>

{@render navigation()}

<EditableLandingSection sectionKey="hero">
  <section class="ui:px-6 ui:pt-12 ui:pb-24 ui:md:pt-16 ui:md:pb-28">
    <div class="ui:max-w-[1120px] ui:mx-auto">
      <BlurFade delay={0} once={true}>
        <div class="ui:flex ui:items-center ui:gap-4 ui:pb-5 ui:mb-10 ui:border-b ui:border-border">
          <span class="ui:text-[11px] ui:font-semibold ui:tracking-[0.2em] ui:uppercase ui:text-foreground">
            {orgName}
          </span>
          <span class="ui:h-px ui:flex-1 ui:bg-border" aria-hidden="true"></span>
          <span class="ui:text-[11px] ui:font-semibold ui:tracking-[0.2em] ui:uppercase ui:text-muted-foreground">
            Learning Report
          </span>
        </div>
      </BlurFade>

      <div class="ui:grid ui:grid-cols-1 ui:md:grid-cols-12 ui:gap-x-8 ui:gap-y-12">
        <div class="ui:md:col-span-7">
          <BlurFade delay={0.08} once={true}>
            <h1
              class="ui:text-4xl ui:md:text-5xl ui:lg:text-[56px] ui:font-semibold ui:tracking-tight ui:leading-[1.05] ui:mb-6 ui:text-foreground"
            >
              {hero.heading}
            </h1>
          </BlurFade>

          <BlurFade delay={0.18} once={true}>
            <p class="ui:text-base ui:md:text-lg ui:text-muted-foreground ui:max-w-xl ui:mb-8 ui:leading-relaxed">
              {hero.subheading}
            </p>
          </BlurFade>

          <BlurFade delay={0.28} once={true}>
            <div class="ui:flex ui:flex-wrap ui:items-center ui:gap-3">
              <Button
                href={hero.primaryAction.href}
                disabled={hero.primaryAction.disabled ?? false}
                class="ui:rounded-none ui:px-6 ui:font-medium"
              >
                {hero.primaryAction.label}
              </Button>
              {#if hero.secondaryAction}
                <SecondaryActionButton
                  href={hero.secondaryAction.href}
                  label={hero.secondaryAction.label}
                  variant="corporate"
                />
              {/if}
            </div>
          </BlurFade>
        </div>

        {#if stats.length > 0}
          <aside class="ui:md:col-span-4 ui:md:col-start-9 ui:md:border-l ui:md:border-border ui:md:pl-8">
            <BlurFade delay={0.32} once={true}>
              <p
                class="ui:text-[11px] ui:font-semibold ui:tracking-[0.2em] ui:uppercase ui:text-muted-foreground ui:mb-6"
              >
                At a glance
              </p>

              <dl class="ui:flex ui:flex-col">
                {#each stats as stat, index (`${stat.label}-${index}`)}
                  <div
                    class="ui:flex ui:items-baseline ui:justify-between ui:gap-4 ui:py-4 ui:border-t ui:border-border ui:first:border-t-0"
                  >
                    <div class="ui:flex ui:items-baseline ui:gap-3 ui:min-w-0">
                      <span class="ui:text-[11px] ui:font-mono ui:text-muted-foreground ui:tabular-nums">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <dt class="ui:text-sm ui:text-foreground ui:truncate">
                        {stat.label}
                      </dt>
                    </div>
                    <dd
                      class="ui:text-2xl ui:md:text-3xl ui:font-semibold ui:tracking-tight ui:tabular-nums ui:text-foreground ui:m-0"
                    >
                      {stat.value}
                    </dd>
                  </div>
                {/each}
              </dl>
            </BlurFade>
          </aside>
        {/if}
      </div>
    </div>
  </section>
</EditableLandingSection>
