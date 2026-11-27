<script lang="ts">
  interface Props {
    title: string;
    description: string;
    stylesheets?: string[];
    sections?: boolean;
  }

  let { title, description, stylesheets = [], sections = true }: Props = $props();
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="stylesheet" href="/home/styles.css" />
  {#if sections}
    <link rel="stylesheet" href="/home/sections.css" />
  {/if}
  {#each stylesheets as href}
    <link rel="stylesheet" {href} />
  {/each}
  <style>
    .nav-header .block {
      padding: 0;
      border-top: 0;
    }

    .nav-header {
      line-height: 1.5;
    }

    .nav-header button,
    .nav-header a {
      all: revert-layer;
    }

    footer {
      line-height: 1.5;
    }

    footer button,
    footer a {
      all: revert-layer;
    }

    main#top {
      --muted: #6b6e76;
      --card: #f4f4f3;
    }
  </style>
</svelte:head>
