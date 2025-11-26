<script lang="ts">
<<<<<<< HEAD
	import { Collapsible as CollapsiblePrimitive } from "bits-ui";

	let {
		ref = $bindable(null),
		open = $bindable(false),
		...restProps
	}: CollapsiblePrimitive.RootProps = $props();
=======
  import { Collapsible as CollapsiblePrimitive } from 'bits-ui';

  let { ref = $bindable(null), open = $bindable(false), ...restProps }: CollapsiblePrimitive.RootProps = $props();
>>>>>>> feat/release-v2
</script>

<CollapsiblePrimitive.Root bind:ref bind:open data-slot="collapsible" {...restProps} />
