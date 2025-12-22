<script lang="ts">
  import CircleContent from './circle-content.svelte';

  interface Props {
    answers?: number;
  }

  let { answers = 0 }: Props = $props();
</script>

<CircleContent value={answers} label="Answer(s)" />
