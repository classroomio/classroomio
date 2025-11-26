<script lang="ts">
<<<<<<< HEAD
	import { Collapsible as CollapsiblePrimitive } from "bits-ui";

	let { ref = $bindable(null), ...restProps }: CollapsiblePrimitive.TriggerProps = $props();
=======
  import { Collapsible as CollapsiblePrimitive } from 'bits-ui';

  let { ref = $bindable(null), ...restProps }: CollapsiblePrimitive.TriggerProps = $props();
>>>>>>> feat/release-v2
</script>

<CollapsiblePrimitive.Trigger bind:ref data-slot="collapsible-trigger" {...restProps} />
