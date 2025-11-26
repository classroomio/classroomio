<script lang="ts">
<<<<<<< HEAD
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "../../tools";

	let {
		ref = $bindable(null),
		value = $bindable(""),
		class: className,
		...restProps
	}: TabsPrimitive.RootProps = $props();
</script>

<TabsPrimitive.Root
	bind:ref
	bind:value
	data-slot="tabs"
	class={cn("flex flex-col gap-2", className)}
	{...restProps}
=======
  import { Tabs as TabsPrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let {
    ref = $bindable(null),
    value = $bindable(''),
    class: className,
    ...restProps
  }: TabsPrimitive.RootProps = $props();
</script>

<TabsPrimitive.Root
  bind:ref
  bind:value
  data-slot="tabs"
  class={cn('ui:flex ui:flex-col ui:gap-2', className)}
  {...restProps}
>>>>>>> feat/release-v2
/>
