<script>
	import ArrowUp16 from "carbon-icons-svelte/lib/ArrowUp16";
	import Chip from "./Chip.svelte";

	export let value = 0;
</script>


<div class="vote">
  <ArrowUp16 />
  <Chip value="{value}" />
</div>

<style>
	.vote {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 56px;
		width: 56px;
		justify-content: center;
		margin-right: 10px;
	}
</style>
