<script>
	import Arrow from '../../components/generic/Arrow.svelte';
	import { getContext } from 'svelte';
	import { storeContextKey } from '../../context';
	import dayjs from 'dayjs';
	import KeyControls from '../../components/generic/KeyControls.svelte';

	const store = getContext(storeContextKey);

	const UNIT_BY_VIEW = {
		days: 'month',
		months: 'year',
		years: 'year'
	};

	$: visibleMonth = dayjs(new Date($store.year, $store.month, 1));
	$: label = `${$store.activeView === 'days' ? visibleMonth.format('MMMM ') : ''}${$store.year}`;
	$: addMult = $store.activeView === 'years' ? 10 : 1;

	const add = (amount) => () => store.add(amount * addMult, UNIT_BY_VIEW[$store.activeView]);

	const VIEW_TRANSITIONS = ['days', 'months', 'years'];
	const updateActiveView = () => {
		const transitionIndex = VIEW_TRANSITIONS.indexOf($store.activeView) + 1;
		const newView = transitionIndex ? VIEW_TRANSITIONS[transitionIndex] : null;
		if (newView) store.setActiveView(newView);
	};

	const KEY_MAPPINGS = {
		pageDown: add(-1),
		pageUp: add(1),
		control: updateActiveView
	};
</script>

<KeyControls ctx={['days', 'months', 'years']} limit={180} {...KEY_MAPPINGS} />
<div class="controls">
	<div class="button" on:click={add(-1)}>
		<Arrow dir="left" />
	</div>
	<span class="button label" on:click={updateActiveView}>
		{label}
	</span>
	<div class="button" on:click={add(1)}>
		<Arrow dir="right" />
	</div>
</div>

<style>
	.controls {
		display: grid;
		grid-template-columns: auto 1fr auto auto;
		align-items: center;
		text-align: center;
		z-index: 2;
		border-bottom: 1px solid var(--sc-theme-calendar-colors-border);
		/* box-shadow: 0px 4px 3px rgba(0, 0, 0, 0.15); */
		font-size: 1.5em;
		/* color: var(--sc-theme-calendar-colors-text-primary); */
		overflow: hidden;
	}
	.controls > :global(*) {
		height: 80px;
		padding: 0 17px;
		display: grid;
		align-items: center;
	}
	.button {
		padding: 10px 18px;
		cursor: pointer;
		background: var(--sc-theme-calendar-colors-background-primary);
		transition: all 100ms linear;
	}
	.button:hover {
		background: var(--sc-theme-calendar-colors-background-hover);
	}
	.label {
		font-weight: bold;
	}
</style>
