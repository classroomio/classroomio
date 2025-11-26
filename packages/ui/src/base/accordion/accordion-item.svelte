<script lang="ts">
<<<<<<< HEAD
	import { Accordion as AccordionPrimitive } from "bits-ui";
	import { cn } from "../../tools";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: AccordionPrimitive.ItemProps = $props();
</script>

<AccordionPrimitive.Item
	bind:ref
	data-slot="accordion-item"
	class={cn("border-b last:border-b-0", className)}
	{...restProps}
=======
  import { Accordion as AccordionPrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let { ref = $bindable(null), class: className, ...restProps }: AccordionPrimitive.ItemProps = $props();
</script>

<AccordionPrimitive.Item
  bind:ref
  data-slot="accordion-item"
  class={cn('ui:border-b ui:last:border-b-0', className)}
  {...restProps}
>>>>>>> feat/release-v2
/>
