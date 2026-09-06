<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    id?: string;
    eyebrow?: string;
    heading?: string;
    children: Snippet;
  }

  let { id, eyebrow, heading, children }: Props = $props();
</script>

<!-- The ruled section rhythm Quartz uses everywhere: hairline, eyebrow, heading, content. -->
<section {id} class="ui:px-5 ui:md:px-8 ui:py-11 ui:border-t ui:border-[var(--landing-border)]">
  {#if eyebrow}
    <p
      class="ui:m-0 ui:mb-2 ui:text-xs ui:text-[var(--landing-fg-faint)] ui:[letter-spacing:var(--landing-eyebrow-tracking)] ui:[text-transform:var(--landing-eyebrow-case)]"
    >
      {eyebrow}
    </p>
  {/if}
  {#if heading}
    <h2
      class="ui:m-0 ui:mb-5 ui:text-2xl ui:text-[var(--landing-fg)] ui:[font-weight:var(--landing-heading-weight)] ui:[letter-spacing:var(--landing-heading-tracking)]"
    >
      {heading}
    </h2>
  {/if}
  {@render children()}
</section>
