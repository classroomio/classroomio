<script>
	import InfiniteGrid from './InfiniteGrid.svelte';

	export let value;
	export let values;
	export let index = 0;

	const cellCount = 1;
	const get = (i) => ({ value: values[i] });

	$: itemCount = values.length;
	$: index = values.indexOf(value);
</script>

<InfiniteGrid {cellCount} {itemCount} {index} {get} let:value>
	<slot {value} />
</InfiniteGrid>
