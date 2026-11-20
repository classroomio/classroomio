<script lang="ts">
  import ViewToggle from '$features/ui/view-toggle.svelte';
  import type { LearningPathView } from './types';

  interface Props {
    view: LearningPathView;
    onChange?: (view: LearningPathView) => void;
  }

  let { view, onChange }: Props = $props();
</script>

<ViewToggle {view} {onChange} />
