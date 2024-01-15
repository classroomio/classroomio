<script>
	import NavBar from './NavBar.svelte';
	import NavBarItem from './NavBarItem.svelte';

	export let codeLabel = 'code';
	export let exampleLabel = 'example';
	export let gridTemplate = '1fr / 1fr auto';
	export let style = '';

	let showCode = false;

	const setCodeVis = (bool) => () => (showCode = bool);

	$: s = [`--grid-template: ${gridTemplate}`, style].filter(Boolean).join(';');
</script>

<div class="grid">
	<NavBar>
		<NavBarItem on:click={setCodeVis(true)} isActive={() => showCode}>
			{codeLabel}
		</NavBarItem>
		<NavBarItem on:click={setCodeVis(false)} isActive={() => !showCode}>
			{exampleLabel}
		</NavBarItem>
	</NavBar>
	<div class="inner-grid" style={s}>
		<div class="cell" class:vis={showCode}>
			<slot name="code" />
		</div>
		<div class="cell" class:vis={!showCode}>
			<slot />
		</div>
	</div>
</div>

<style>
	.inner-grid {
		display: grid;
		grid-template: 1fr / 1fr;
		height: 100%;
	}
	.cell {
		grid-row: 1;
		grid-column: 1;
		height: 100%;
		/* overflow-y: auto; */
		display: none;
	}
	.cell.vis {
		display: grid;
	}
	.cell:last-child {
		z-index: 0;
	}
	.grid {
		display: grid;
		height: 100%;
		grid-template-rows: auto 1fr;
	}
	.grid > :global(nav) {
		background: #fff;
		box-shadow: 0px 3px 5px 3px rgba(0, 0, 0, 0.3);
	}
	.grid > :global(nav a) {
		color: #111;
	}
	.grid > :global(nav .highlight) {
		background: #eee;
		border-bottom-width: 3px;
		border-bottom-color: var(--sc-theme-calendar-colors-background-highlight);
	}
	@media (min-width: 720px) {
		.grid {
			height: auto;
			grid-template: 1fr / 1fr;
		}
		.grid > :global(nav) {
			display: none;
		}
		.inner-grid {
			grid-template: var(--grid-template);
		}
		.cell {
			grid-row: auto;
			grid-column: auto;
			display: grid;
		}
		.cell.vis {
			display: grid;
		}
	}
</style>
