<script lang="ts">
  import CircleCheckIcon from '@lucide/svelte/icons/circle-check';

  interface Props {
    filled?: Boolean;
  }

  let { filled }: Props = $props();
</script>

<CircleCheckIcon class={filled ? 'filled' : ''} />
