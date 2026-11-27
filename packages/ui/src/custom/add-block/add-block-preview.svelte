<script lang="ts">
  import PreviewScene from './add-block-preview-scene.svelte';
  import type { AddBlockChoice } from './types';

  interface Props {
    choice: AddBlockChoice | null;
    anchor: HTMLElement | null;
    newLabel?: string;
    comingSoonLabel?: string;
  }

  let { choice, anchor, newLabel, comingSoonLabel }: Props = $props();

  const PANEL_HEIGHT = 290;
  const VIEWPORT_MARGIN = 16;

  let shownChoice = $state<AddBlockChoice | null>(null);
  let top = $state(VIEWPORT_MARGIN);

  $effect(() => {
    if (!choice) return;

    shownChoice = choice;
  });

  $effect(() => {
    if (!anchor) return;

    const bounds = anchor.getBoundingClientRect();
    const centered = bounds.top + bounds.height / 2 - PANEL_HEIGHT / 2;
    top = Math.max(VIEWPORT_MARGIN, Math.min(centered, window.innerHeight - PANEL_HEIGHT - VIEWPORT_MARGIN));
  });
</script>

{#if shownChoice}
  <div
    class="preview"
    class:open={Boolean(choice)}
    style:top="{top}px"
    aria-hidden="true"
    data-testid="add-block-preview"
  >
    <PreviewScene scene={shownChoice.scene ?? shownChoice.type} />
    <div class="foot">
      <div class="title">
        <span>{shownChoice.label}</span>
        {#if shownChoice.comingSoon && comingSoonLabel}
          <span class="badge soon">{comingSoonLabel}</span>
        {:else if shownChoice.isNew && newLabel}
          <span class="badge">{newLabel}</span>
        {/if}
      </div>
      {#if shownChoice.caption}
        <p>{shownChoice.caption}</p>
      {/if}
    </div>
  </div>
{/if}

<style>
  .preview {
    position: fixed;
    right: calc(min(100vw, 480px) + 16px);
    width: 340px;
    z-index: 60;
    background: var(--background);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow:
      0 12px 32px -8px rgb(0 0 0 / 0.18),
      0 2px 6px rgb(0 0 0 / 0.06);
    overflow: hidden;
    opacity: 0;
    transform: translateX(6px);
    pointer-events: none;
    transition:
      opacity 140ms,
      transform 140ms,
      top 180ms cubic-bezier(0.3, 0.7, 0.3, 1);
  }

  .preview.open {
    opacity: 1;
    transform: none;
  }

  .foot {
    padding: 12px 14px 14px;
  }

  .title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--foreground);
    font-size: 14px;
    font-weight: 600;
  }

  .foot p {
    margin: 4px 0 0;
    font-size: 12.5px;
    line-height: 1.45;
    color: var(--muted-foreground);
  }

  .badge {
    font-size: 11px;
    font-weight: 500;
    border-radius: 999px;
    padding: 1px 7px;
    background: color-mix(in srgb, var(--primary) 12%, var(--background));
    color: var(--primary);
  }

  .badge.soon {
    background: var(--muted);
    color: var(--muted-foreground);
  }

  @media (max-width: 900px) {
    .preview {
      top: auto !important;
      right: 16px;
      left: 16px;
      bottom: 16px;
      width: auto;
      max-width: 420px;
      margin: 0 auto;
      transform: translateY(6px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .preview {
      transition: opacity 140ms;
    }
  }
</style>
