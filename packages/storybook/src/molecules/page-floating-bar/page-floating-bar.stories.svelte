<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as Page from '@cio/ui/base/page';
  import { Button } from '@cio/ui/base/button';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/PageFloatingBar',
    component: Page.FloatingBar,
    parameters: {
      layout: 'fullscreen',
      controls: { include: FIELDS }
    },
    argTypes: {
      badge: { control: false },
      children: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<script lang="ts">
  let lastAction = $state('none');
</script>

<!-- The bar is sticky to the bottom of its scroll container, so every story
     needs a tall-enough parent for that to be visible. -->
{#snippet shell(children)}
  <div class="bg-muted/30 flex h-[420px] flex-col justify-between p-4">
    <p class="text-muted-foreground text-sm">Page content sits above the bar.</p>
    {@render children()}
  </div>
{/snippet}

<Story name="Selection" args={{ show: true, status: '19 selected' }}>
  {#snippet template(args)}
    {#snippet body()}
      <Page.FloatingBar {...args}>
        <Button variant="secondary" size="sm" class="bg-background text-foreground hover:bg-background/80">Copy</Button>
        <Button variant="secondary" size="sm" class="bg-background text-foreground hover:bg-background/80">
          Export
        </Button>
        <Button variant="default" size="sm" onclick={() => (lastAction = 'actions')}>Actions</Button>
      </Page.FloatingBar>
    {/snippet}
    {@render shell(body)}
  {/snippet}
</Story>

<Story name="Unsaved changes" args={{ show: true, status: 'You have unsaved changes' }}>
  {#snippet template(args)}
    {#snippet body()}
      <Page.FloatingBar {...args}>
        {#snippet badge()}
          <span
            class="bg-primary text-primary-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] leading-none font-semibold"
            aria-hidden="true"
          >
            !
          </span>
        {/snippet}
        <Button variant="secondary" size="sm" class="bg-background text-foreground hover:bg-background/80">
          Discard
        </Button>
        <Button variant="default" size="sm">Save changes</Button>
      </Page.FloatingBar>
    {/snippet}
    {@render shell(body)}
  {/snippet}
</Story>

<Story name="Hidden" args={{ show: false, status: 'Nothing pending' }}>
  {#snippet template(args)}
    {#snippet body()}
      <Page.FloatingBar {...args}>
        <Button variant="default" size="sm">Never rendered</Button>
      </Page.FloatingBar>
    {/snippet}
    {@render shell(body)}
  {/snippet}
</Story>

<Story name="Many actions wrapping" args={{ show: true, status: '1,248 selected' }}>
  {#snippet template(args)}
    {#snippet body()}
      <Page.FloatingBar {...args}>
        <Button variant="secondary" size="sm" class="bg-background text-foreground hover:bg-background/80">
          Select all 12,000 matching
        </Button>
        <Button variant="secondary" size="sm" class="bg-background text-foreground hover:bg-background/80">Copy</Button>
        <Button variant="secondary" size="sm" class="bg-background text-foreground hover:bg-background/80">
          Export
        </Button>
        <Button variant="default" size="sm">Actions</Button>
        <Button variant="ghost" size="sm" class="text-background hover:bg-background/20 hover:text-background">
          Clear
        </Button>
      </Page.FloatingBar>
    {/snippet}
    {@render shell(body)}
  {/snippet}
</Story>

<Story
  name="Long status text"
  args={{ show: true, status: 'All 12,482 students matching the current filters are selected' }}
>
  {#snippet template(args)}
    {#snippet body()}
      <Page.FloatingBar {...args}>
        <Button variant="default" size="sm">Actions</Button>
      </Page.FloatingBar>
    {/snippet}
    {@render shell(body)}
  {/snippet}
</Story>
