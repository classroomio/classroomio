<script lang="ts">
<<<<<<< HEAD
	import { Accordion as AccordionPrimitive } from "bits-ui";
	import { cn, type WithoutChild } from "../../tools";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChild<AccordionPrimitive.ContentProps> = $props();
</script>

<AccordionPrimitive.Content
	bind:ref
	data-slot="accordion-content"
	class="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
	{...restProps}
>
	<div class={cn("pb-4 pt-0", className)}>
		{@render children?.()}
	</div>
=======
  import { Accordion as AccordionPrimitive } from 'bits-ui';
  import { cn, type WithoutChild } from '../../tools';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithoutChild<AccordionPrimitive.ContentProps> = $props();
</script>

<AccordionPrimitive.Content
  bind:ref
  data-slot="accordion-content"
  class="ui:data-[state=closed]:animate-accordion-up ui:data-[state=open]:animate-accordion-down ui:overflow-hidden ui:text-sm"
  {...restProps}
>
  <div class={cn('ui:pb-4 ui:pt-0', className)}>
    {@render children?.()}
  </div>
>>>>>>> feat/release-v2
</AccordionPrimitive.Content>
