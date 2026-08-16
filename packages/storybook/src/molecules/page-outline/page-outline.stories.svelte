<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { PageOutline, injectHeadingIds, withPageTitle } from '@cio/ui';
  import { SafeHtmlContent } from '@cio/ui/custom/safe-html-content';
  import { FIELDS } from './fields';

  const PAGE_TITLE = 'Hallucination & limitations';
  const BODY_HTML = `
    <p>Large language models are incredibly capable, but they also confidently produce incorrect answers — what the field calls <em>hallucination</em>. Before we design systems around them, it helps to build an intuition for where they fail.</p>
    <h2>When LLMs hallucinate</h2>
    <p>Models tend to invent details when they are asked about things outside of their training distribution, when the prompt is ambiguous, or when they are asked to cite sources without retrieval grounding.</p>
    <h3>Ambiguous prompts</h3>
    <p>Leading or underspecified questions invite the model to fill gaps with fluent but unsupported text. Ask for uncertainty, constraints, and the evidence the answer depends on.</p>
    <h3>Missing retrieval</h3>
    <p>Without a search or document store, the model cannot look anything up. It will still produce a citation-shaped answer. Ground generation in retrieved passages before you trust a claim.</p>
    <h2>Mitigations that work</h2>
    <p>The next lessons cover retrieval, tool use, and structured outputs. Use this outline to jump between sections while you read.</p>
    <h3>Retrieval and tools</h3>
    <p>Fetch sources first, then ask the model to answer only from those sources. Prefer tools that return numbers, records, or documents over free-form recollection.</p>
    <h3>Structured outputs</h3>
    <p>Constrain the response to a schema so missing evidence is visible. A JSON field left empty is more useful than a paragraph that hides the gap.</p>
  `;

  const injected = injectHeadingIds(BODY_HTML);
  const outlineItems = withPageTitle(PAGE_TITLE, injected.items);
  const titleId = outlineItems[0]?.id ?? 'hallucination-limitations';

  const { Story } = defineMeta({
    title: 'Molecules/PageOutline',
    component: PageOutline,
    args: {
      items: outlineItems,
      label: 'On this page',
      hideBelow: 'never'
    },
    parameters: {
      layout: 'padded',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });
</script>

<Story name="Nav only">
  {#snippet template()}
    <div class="ui:w-52">
      <PageOutline items={outlineItems} label="On this page" hideBelow="never" />
    </div>
  {/snippet}
</Story>

<Story name="Beside article" parameters={{ layout: 'fullscreen' }}>
  {#snippet template()}
    <div class="ui:mx-auto ui:flex ui:w-full ui:max-w-[calc(48rem+13.5rem)]">
      <article class="ui:min-w-0 ui:w-full ui:max-w-3xl ui:px-4 ui:py-8 ui:sm:px-6">
        <h1 id={titleId} class="ui:scroll-mt-24 ui:text-2xl ui:tracking-tight ui:text-foreground ui:sm:text-3xl">
          {PAGE_TITLE}
        </h1>
        <div class="prose ui:mt-8 ui:max-w-none">
          <SafeHtmlContent content={injected.html} />
        </div>
      </article>
      <aside class="ui:w-52 ui:shrink-0">
        <div class="ui:sticky ui:top-8 ui:max-h-[calc(100dvh-4rem)] ui:overflow-y-auto ui:py-8 ui:pr-4">
          <PageOutline items={outlineItems} label="On this page" hideBelow="never" />
        </div>
      </aside>
    </div>
  {/snippet}
</Story>

<Story
  name="Default · desktop (visible from lg)"
  parameters={{
    layout: 'fullscreen',
    viewport: { defaultViewport: 'desktop' }
  }}
>
  {#snippet template()}
    <div class="ui:mx-auto ui:flex ui:w-full ui:max-w-[calc(48rem+13.5rem)]">
      <article class="ui:min-w-0 ui:w-full ui:max-w-3xl ui:px-4 ui:py-8">
        <h1 id={titleId} class="ui:scroll-mt-24 ui:text-2xl ui:tracking-tight ui:text-foreground">
          {PAGE_TITLE}
        </h1>
        <p class="ui:mt-3 ui:text-sm ui:text-muted-foreground">
          Default <code>hideBelow="lg"</code> — the outline is visible at the desktop viewport.
        </p>
        <div class="prose ui:mt-8 ui:max-w-none">
          <SafeHtmlContent content={injected.html} />
        </div>
      </article>
      <aside class="ui:w-52 ui:shrink-0 ui:py-8 ui:pr-4">
        <PageOutline items={outlineItems} label="On this page" />
      </aside>
    </div>
  {/snippet}
</Story>

<Story
  name="Default · mobile (hidden below lg)"
  parameters={{
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile2' }
  }}
>
  {#snippet template()}
    <div class="ui:mx-auto ui:w-full ui:max-w-3xl ui:px-4 ui:py-8">
      <h1 id={titleId} class="ui:scroll-mt-24 ui:text-2xl ui:tracking-tight ui:text-foreground">
        {PAGE_TITLE}
      </h1>
      <p class="ui:mt-3 ui:text-sm ui:text-muted-foreground">
        Default <code>hideBelow="lg"</code> — the outline does not render on mobile.
      </p>
      <div class="prose ui:mt-8 ui:max-w-none">
        <SafeHtmlContent content={injected.html} />
      </div>
      <PageOutline items={outlineItems} label="On this page" />
    </div>
  {/snippet}
</Story>
