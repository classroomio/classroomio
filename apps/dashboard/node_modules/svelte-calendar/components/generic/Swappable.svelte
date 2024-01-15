<script>
	import { tick } from 'svelte';

	import { quintOut } from 'svelte/easing';

	import { fly, fade } from 'svelte/transition';
	export let value;
	export let getId = (value) => value?.id || value;
	export let vertical = true;
	export let magnitude = 1;
	export let opacity = 1;
	export let delay = 1;

	let height;
	let width;

	let arr;
	let dir;

	// todo: this implementation is a little hacky. we can maybe use custom transitions to allow in
	// and out to fly in correct direction instead of this await tick() business

	const replaceArr = async (newArr) => {
		await tick();
		arr = newArr;
	};

	$: xMult = vertical ? 0 : 1;
	$: yMult = vertical ? 1 : 0;
	$: {
		if (arr?.[0].value !== value) {
			const id = getId(value);
			dir = !arr ? 1 : arr[0].id > id ? -1 : 1;
			const newArr = [{ value, id }];
			if (arr) {
				replaceArr(newArr);
			} else {
				arr = newArr;
			}
		}
	}
	$: inOptions = {
		duration: 650,
		opacity,
		easing: quintOut,
		delay,
		...(vertical ? { y: magnitude * dir * height } : { x: magnitude * dir * width })
	};
	$: outOptions = {
		...inOptions,
		...(vertical ? { y: -1 * magnitude * dir * height } : { x: -1 * magnitude * dir * width })
	};
</script>

<div class="grid">
	{#each arr as { value, id } (id)}
		<div
			class="cell"
			out:fly|local={outOptions}
			in:fly|local={inOptions}
			bind:clientWidth={width}
			bind:clientHeight={height}
		>
			<slot {value} />
		</div>
	{/each}
</div>

<style>
	.grid {
		display: grid;
		grid-template: 1fr / 1fr;
		overflow: hidden;
	}
	.cell {
		display: grid;
		grid-column: 1;
		grid-row: 1;
	}
</style>
