<script lang="ts">
<<<<<<< HEAD
	import { Dialog as SheetPrimitive } from "bits-ui";

	let { ref = $bindable(null), ...restProps }: SheetPrimitive.CloseProps = $props();
=======
  import { Dialog as SheetPrimitive } from 'bits-ui';

  let { ref = $bindable(null), ...restProps }: SheetPrimitive.CloseProps = $props();
>>>>>>> feat/release-v2
</script>

<SheetPrimitive.Close bind:ref data-slot="sheet-close" {...restProps} />
