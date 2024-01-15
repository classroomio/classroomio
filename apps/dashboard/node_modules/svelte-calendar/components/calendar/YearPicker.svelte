<script>
	import { getContext } from 'svelte';
	import { storeContextKey } from '../../context';
	import KeyControls from '../../components/generic/KeyControls.svelte';
	import Grid from '../../components/generic/Grid.svelte';
	import InfiniteGrid from '../../components/generic/InfiniteGrid.svelte';
	import scrollable from '../../directives/scrollable';
	import { scrollStep } from '../../config/scroll';

	export let rowCount = 3;
	export let colCount = 3;

	const store = getContext(storeContextKey);

	const close = () => store.setActiveView('months');
	const add = (amount) => () => {
		const result = $store.year + amount;
		if (result < startYear || result > endYear) return;
		store.add(amount, 'year', ['month', 'date']);
	};
	const get = (index) => {
		const firstYear = startYear + index * numPerPage;
		return {
			years: Array(numPerPage)
				.fill(0)
				.map((d, i) => ({
					number: firstYear + i,
					selectable: firstYear + i <= endYear
				}))
		};
	};

	const updateIndex = ({ detail: { step: newIndex } }) => {
		store.add(numPerPage * (newIndex - yearIndex), 'year', ['year', 'month', 'date']);
	};

	$: KEY_MAPPINGS = {
		up: add(-1 * colCount),
		down: add(colCount),
		left: add(-1),
		right: add(1),
		enter: close,
		escape: close
	};
	$: startYear = $store.start.getFullYear();
	$: endYear = $store.end.getFullYear();
	$: numPerPage = rowCount * colCount;
	$: itemCount = Math.ceil(endYear - startYear + 1) / numPerPage;
	$: yearIndex = Math.floor(($store.year - startYear) / numPerPage);
	$: initialY = yearIndex * scrollStep;

	const select = (year) => () => {
		if (!year.selectable) return;
		store.setYear(year.number);
		close();
	};
</script>

<KeyControls {...KEY_MAPPINGS} ctx={['years']} />

<div use:scrollable={{ y: initialY, step: scrollStep, maxSteps: itemCount }} on:y={updateIndex}>
	<InfiniteGrid cellCount={1} {itemCount} bind:index={yearIndex} {get} let:years>
		<Grid template="repeat({rowCount}, 1fr) / repeat({colCount}, 1fr)">
			{#each years as year}
				<a
					href="#year"
					on:click|preventDefault={select(year)}
					class:selected={$store.year === year.number}
					class:disabled={!year.selectable}
				>
					{year.number}
				</a>
			{/each}
		</Grid>
	</InfiniteGrid>
</div>

<style>
	div {
		display: grid;
		height: 100%;
	}
</style>
