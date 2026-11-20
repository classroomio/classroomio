<script lang="ts">
  import { cn } from '../../tools';
  import { MathText } from '../math-text';

  interface Props {
    title: string;
    class?: string;
  }

  let { title, class: className = '' }: Props = $props();
</script>

<h4 class={cn('ui:font-medium', className)}><MathText text={title} /></h4>
