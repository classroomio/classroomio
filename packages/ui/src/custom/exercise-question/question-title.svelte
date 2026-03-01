<script lang="ts">
  import { cn } from '../../tools';

  interface Props {
    title: string;
    class?: string;
  }

  let { title, class: className = '' }: Props = $props();
</script>

<h4 class={cn('ui:font-medium', className)}>{title}</h4>
