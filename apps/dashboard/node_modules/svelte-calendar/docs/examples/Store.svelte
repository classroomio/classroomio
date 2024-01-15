<script>
	import { InlineCalendar } from '../../index';
	import dayjs from 'dayjs';

	const theme = {
		calendar: {
			width: '600px',
			shadow: '0px 0px 5px rgba(0, 0, 0, 0.25)'
		}
	};

	let store;
</script>

<InlineCalendar bind:store {theme} />

<div class="grid">
	<button on:click={() => store.add(-1, 'year')}>-1y</button>
	<button on:click={() => store.add(-1, 'month')}>-1m</button>
	<button class="day" on:click={() => store.add(-1, 'day')}>-1d</button>
	<p>
		{dayjs($store?.selected).format('MM/DD/YYYY')}
	</p>
	<button class="day" on:click={() => store.add(1, 'day')}>+1d</button>
	<button on:click={() => store.add(1, 'month')}>+1m</button>
	<button on:click={() => store.add(1, 'year')}>+1y</button>
</div>

<!-- Example Notes -->
<p>You can access both the store's state and methods.</p>

<style>
	.grid {
		background: #333;
		color: #fff;
		display: grid;
		grid-template-columns: auto auto auto 1fr auto auto auto;
		text-align: center;
		align-items: center;
		width: 600px;
		max-width: var(--sc-theme-calendar-maxWidth);
	}
	button {
		display: grid;
		height: 100%;
		align-items: center;
		background: var(--sc-theme-calendar-colors-background-highlight);
		border: 0;
		padding: 18px;
		color: var(--sc-theme-calendar-colors-text-highlight);
		font-size: 1.1em;
		cursor: pointer;
	}
	@media (max-width: 480px) {
		.grid {
			grid-template-columns: auto auto 1fr auto auto;
		}
		.day {
			display: none;
		}
	}
</style>
