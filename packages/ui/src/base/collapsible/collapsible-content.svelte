<script lang="ts">
<<<<<<< HEAD
	import { Collapsible as CollapsiblePrimitive } from "bits-ui";

	let { ref = $bindable(null), ...restProps }: CollapsiblePrimitive.ContentProps = $props();
=======
  import { Collapsible as CollapsiblePrimitive } from 'bits-ui';

  let { ref = $bindable(null), ...restProps }: CollapsiblePrimitive.ContentProps = $props();
>>>>>>> feat/release-v2
</script>

<CollapsiblePrimitive.Content bind:ref data-slot="collapsible-content" {...restProps} />
