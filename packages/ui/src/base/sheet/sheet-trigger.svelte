<script lang="ts">
<<<<<<< HEAD
	import { Dialog as SheetPrimitive } from "bits-ui";

	let { ref = $bindable(null), ...restProps }: SheetPrimitive.TriggerProps = $props();
=======
  import { Dialog as SheetPrimitive } from 'bits-ui';

  let { ref = $bindable(null), ...restProps }: SheetPrimitive.TriggerProps = $props();
>>>>>>> feat/release-v2
</script>

<SheetPrimitive.Trigger bind:ref data-slot="sheet-trigger" {...restProps} />
