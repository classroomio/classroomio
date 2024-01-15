<script>
	import { writable } from 'svelte/store';

	export let y = 0;
	const last = writable(0);

	const wheel = (evt) => (y += evt.deltaY);
	const touchstart = ({ touches }) => last.set(touches[0].pageY);
	const touchmove = ({ touches }) => {
		y -= touches[0].pageY - $last;
		last.set(touches[0].pageY);
	};
</script>

<div
	on:wheel={wheel}
	on:touchstart|stopPropagation={touchstart}
	on:touchmove|stopPropagation={touchmove}
>
	<slot />
</div>

<style>
	div {
		height: 100%;
		display: grid;
		overflow: hidden;
	}
</style>
