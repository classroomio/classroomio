<script lang="ts">
<<<<<<< HEAD
	import { Dialog as DialogPrimitive } from "bits-ui";

	let { ref = $bindable(null), ...restProps }: DialogPrimitive.TriggerProps = $props();
=======
  import { Dialog as DialogPrimitive } from 'bits-ui';

  let { ref = $bindable(null), ...restProps }: DialogPrimitive.TriggerProps = $props();
>>>>>>> feat/release-v2
</script>

<DialogPrimitive.Trigger bind:ref data-slot="dialog-trigger" {...restProps} />
