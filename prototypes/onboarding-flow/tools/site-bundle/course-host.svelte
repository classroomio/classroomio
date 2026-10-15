<script lang="ts">
  import type { Component } from 'svelte';
  import { setLandingPageEditContext } from '../../../../packages/ui/src/custom/org-landing-page/edit-context';

  interface Props {
    Theme: Component<any>;
    initial: Record<string, unknown>;
    edit?: {
      onSelect: (key: string | null) => void;
      labelFor: (key: string) => string;
      iconFor: (key: string) => Component | undefined;
    } | null;
  }

  let { Theme, initial, edit = null }: Props = $props();

  let current = $state.raw(initial);
  let selected = $state<string | null>(null);

  if (edit) {
    setLandingPageEditContext({
      selectedKey: () => selected as never,
      selectKey: (key) => {
        selected = key;
        edit.onSelect(key);
      },
      labelFor: (key) => edit.labelFor(key),
      iconFor: (key) => edit.iconFor(key) as Component
    });
  }

  export function update(next: Record<string, unknown>) {
    current = next;
  }

  export function select(key: string | null) {
    selected = key;
  }
</script>

<Theme {...current} />
