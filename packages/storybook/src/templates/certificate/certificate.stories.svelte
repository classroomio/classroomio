<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Certificate } from '@cio/ui';
  import {
    CERTIFICATE_TEMPLATE_LIST,
    LONG_RENDER_DATA,
    MINIMAL_RENDER_DATA,
    SAMPLE_RENDER_DATA,
    STORY_ACCENT_VARIATIONS,
    buildDesign
  } from './fixtures';

  const { Story } = defineMeta({
    title: 'Templates/Certificate',
    component: Certificate.Preview,
    parameters: {
      layout: 'fullscreen'
    },
    tags: ['autodocs']
  });
</script>

<Story name="Gallery · all templates">
  {#snippet template()}
    <div class="grid grid-cols-1 gap-6 bg-zinc-100 p-6 md:grid-cols-2 xl:grid-cols-3">
      {#each CERTIFICATE_TEMPLATE_LIST as template (template.id)}
        <figure class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div class="aspect-[1.4/1] w-full">
            <Certificate.Preview design={buildDesign(template.id)} data={SAMPLE_RENDER_DATA} />
          </div>
          <figcaption class="border-t border-zinc-200 px-4 py-3">
            <h3 class="text-sm font-medium text-zinc-900">{template.label}</h3>
            <p class="mt-0.5 text-xs text-zinc-500">{template.description}</p>
          </figcaption>
        </figure>
      {/each}
    </div>
  {/snippet}
</Story>

<Story name="Classique · full-size">
  {#snippet template()}
    <div class="flex h-screen items-center justify-center bg-zinc-100 p-8">
      <div class="aspect-[1.4/1] w-full max-w-5xl">
        <Certificate.Preview design={buildDesign('classique')} data={SAMPLE_RENDER_DATA} showControls />
      </div>
    </div>
  {/snippet}
</Story>

<Story name="Brutalist · full-size">
  {#snippet template()}
    <div class="flex h-screen items-center justify-center bg-zinc-100 p-8">
      <div class="aspect-[1.4/1] w-full max-w-5xl">
        <Certificate.Preview
          design={buildDesign('brutalist', { accentColor: '#ff4500' })}
          data={SAMPLE_RENDER_DATA}
          showControls
        />
      </div>
    </div>
  {/snippet}
</Story>

<Story name="Noir · full-size">
  {#snippet template()}
    <div class="flex h-screen items-center justify-center bg-zinc-950 p-8">
      <div class="aspect-[1.4/1] w-full max-w-5xl">
        <Certificate.Preview
          design={buildDesign('noir', { accentColor: '#d4af37' })}
          data={SAMPLE_RENDER_DATA}
          showControls
        />
      </div>
    </div>
  {/snippet}
</Story>

<Story name="Poster · full-size">
  {#snippet template()}
    <div class="flex h-screen items-center justify-center bg-zinc-100 p-8">
      <div class="aspect-[1.4/1] w-full max-w-5xl">
        <Certificate.Preview
          design={buildDesign('poster', { accentColor: '#ff5722' })}
          data={SAMPLE_RENDER_DATA}
          showControls
        />
      </div>
    </div>
  {/snippet}
</Story>

<Story name="Minimal · full-size">
  {#snippet template()}
    <div class="flex h-screen items-center justify-center bg-zinc-100 p-8">
      <div class="aspect-[1.4/1] w-full max-w-5xl">
        <Certificate.Preview design={buildDesign('minimal')} data={SAMPLE_RENDER_DATA} showControls />
      </div>
    </div>
  {/snippet}
</Story>

<Story name="Classique · accent variations">
  {#snippet template()}
    <div class="grid grid-cols-1 gap-5 bg-zinc-100 p-6 md:grid-cols-2 xl:grid-cols-3">
      {#each STORY_ACCENT_VARIATIONS as accent (accent)}
        <figure class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div class="aspect-[1.4/1] w-full">
            <Certificate.Preview design={buildDesign('classique', { accentColor: accent })} data={SAMPLE_RENDER_DATA} />
          </div>
          <figcaption class="border-t border-zinc-200 px-4 py-2 text-xs text-zinc-600">
            <code>{accent}</code>
          </figcaption>
        </figure>
      {/each}
    </div>
  {/snippet}
</Story>

<Story name="Edge cases · long names + short data">
  {#snippet template()}
    <div class="grid grid-cols-1 gap-5 bg-zinc-100 p-6 xl:grid-cols-2">
      <figure class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div class="aspect-[1.4/1] w-full">
          <Certificate.Preview design={buildDesign('poster')} data={LONG_RENDER_DATA} />
        </div>
        <figcaption class="border-t border-zinc-200 px-4 py-3 text-xs text-zinc-600">
          Long names · poster template
        </figcaption>
      </figure>
      <figure class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div class="aspect-[1.4/1] w-full">
          <Certificate.Preview design={buildDesign('minimal')} data={MINIMAL_RENDER_DATA} />
        </div>
        <figcaption class="border-t border-zinc-200 px-4 py-3 text-xs text-zinc-600">
          Minimal copy · minimal template
        </figcaption>
      </figure>
    </div>
  {/snippet}
</Story>
