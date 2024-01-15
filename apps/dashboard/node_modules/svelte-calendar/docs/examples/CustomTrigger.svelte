<script>
	import dayjs from 'dayjs';
	import { Datepicker } from '../../index';

	let store;
</script>

<Datepicker bind:store let:key let:send let:receive>
	<button in:receive|local={{ key }} out:send|local={{ key }}>
		{#if $store?.hasChosen}
			{dayjs($store.selected).format('ddd MMM D, YYYY')}
		{:else}
			Pick a Date
		{/if}
	</button>
</Datepicker>

<style>
	button {
		background: purple;
		color: #fff;
		border: 0;
		padding: 18px 30px;
		font-size: 1.2em;
		border-radius: 6px;
		cursor: pointer;
	}
</style>
