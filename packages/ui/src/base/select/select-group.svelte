<script lang="ts">
<<<<<<< HEAD
	import { Select as SelectPrimitive } from "bits-ui";

	let { ref = $bindable(null), ...restProps }: SelectPrimitive.GroupProps = $props();
=======
  import { Select as SelectPrimitive } from 'bits-ui';

  let { ref = $bindable(null), ...restProps }: SelectPrimitive.GroupProps = $props();
>>>>>>> feat/release-v2
</script>

<SelectPrimitive.Group data-slot="select-group" {...restProps} />
