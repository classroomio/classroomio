<script lang="ts">
  import { STORY_SLIDES } from '$lib/data/homepage-data';

  interface Props {
    heading?: string;
    toneWord: string;
    sectionClass?: string;
  }

  let { heading = 'Meet the companies using', toneWord, sectionClass = 'ab-sec' }: Props = $props();
</script>

<section class={sectionClass} id="story" aria-label="Customer stories">
  <h2 class="h2 story-h" data-split>{heading} <span class="tone">{toneWord}</span></h2>
  <div class="ts" id="ts" data-in>
    <div class="ts-tabs" role="tablist" aria-label="Customer stories">
      {#each STORY_SLIDES as slide, index}
        <button class="ts-tab" class:on={index === 0} role="tab" aria-selected={index === 0}>
          {#if slide.tab.type === 'image'}
            <img class:mono={slide.tab.mono} src={slide.tab.src} alt={slide.tab.alt} />
          {:else}
            <span>{slide.tab.text}</span>
          {/if}
          <i></i>
        </button>
      {/each}
    </div>

    <div class="ts-slides">
      {#each STORY_SLIDES as slide, index}
        <div class="ts-slide" class:on={index === 0}>
          <div class="ts-card">
            <div class="ts-photo" class:ts-portrait={slide.photo.portrait}>
              <img src={slide.photo.src} alt={slide.photo.alt} />
              {#if slide.photo.hasPlay}
                <span class="play" aria-hidden="true"></span>
                <span class="story-len">{slide.photo.storyLength}</span>
              {/if}
            </div>
            <div class="ts-body">
              <blockquote>{slide.quote}</blockquote>
              <div class="ts-meta">
                <span class="ts-chip"><b>{slide.person.split(' · ')[0]}</b> · {slide.person.split(' · ')[1]}</span>
                {#if slide.logo}
                  <span class="ts-chip ts-logo"
                    ><img class:mono={slide.logo.mono} src={slide.logo.src} alt={slide.logo.alt} /></span
                  >
                {/if}
                {#if slide.link}
                  <a
                    class="ts-link"
                    href={slide.link.href}
                    target={slide.link.external ? '_blank' : undefined}
                    rel={slide.link.external ? 'noopener' : undefined}>{slide.link.text} <span>›</span></a
                  >
                {/if}
              </div>
            </div>
          </div>
          <div class="ts-stats">
            {#each slide.stats as stat}
              <div><b>{stat.label}</b><span>{stat.detail}</span></div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>
