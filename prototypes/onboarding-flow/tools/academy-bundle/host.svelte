<script lang="ts">
  /*
   * Mounts a component with props the page can replace later (`update`), so a page script drives the real
   * Svelte component without remounting it on every state change.
   */
  import type { Component } from 'svelte';

  interface Props {
    Comp: Component<any>;
    initial: Record<string, unknown>;
  }

  let { Comp, initial }: Props = $props();

  let current = $state.raw(initial);

  export function update(next: Record<string, unknown>) {
    current = { ...current, ...next };
  }
</script>

<Comp {...current} />
