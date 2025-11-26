<script lang="ts">
<<<<<<< HEAD
	import { Menubar as MenubarPrimitive } from "bits-ui";

	let {
		ref = $bindable(null),
		...restProps
	}: MenubarPrimitive.GroupProps & {
		inset?: boolean;
	} = $props();
=======
  import { Menubar as MenubarPrimitive } from 'bits-ui';

  let {
    ref = $bindable(null),
    ...restProps
  }: MenubarPrimitive.GroupProps & {
    inset?: boolean;
  } = $props();
>>>>>>> feat/release-v2
</script>

<MenubarPrimitive.Group bind:ref data-slot="menubar-group" {...restProps} />
