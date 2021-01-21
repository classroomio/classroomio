<script>
	import ArrowUp16 from "carbon-icons-svelte/lib/ArrowUp16";
	import Chip from "./Chip.svelte";

	export let value = 0;

	function upVote() {
		value = value + 1;
	}
</script>


<div
	class="vote border-none cursor-pointer"
	on:click={upVote}
>
  <ArrowUp16 />
  <Chip value="{value}" />
</div>

<style>
	.vote {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 25px;
		width: 25px;
		justify-content: center;
		margin-right: 10px;
	}
</style>
