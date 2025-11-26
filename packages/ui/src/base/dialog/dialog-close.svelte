<script lang="ts">
<<<<<<< HEAD
	import { Dialog as DialogPrimitive } from "bits-ui";

	let { ref = $bindable(null), ...restProps }: DialogPrimitive.CloseProps = $props();
=======
  import { Dialog as DialogPrimitive } from 'bits-ui';

  let { ref = $bindable(null), ...restProps }: DialogPrimitive.CloseProps = $props();
>>>>>>> feat/release-v2
</script>

<DialogPrimitive.Close bind:ref data-slot="dialog-close" {...restProps} />
