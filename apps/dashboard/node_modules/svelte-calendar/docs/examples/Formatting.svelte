<script>
	import { Datepicker } from '../../index';

	let format = 'dddd, MMMM D, YYYY';
</script>

<Datepicker {format} />
<input type="text" bind:value={format} />

<!-- Example Notes -->
<p>
	See <a href="https://day.js.org/docs/en/display/format">dayjs</a> documentation for formatting docs
</p>

<style>
	input {
		height: 30px;
		border: 1px solid #333;
		padding: 18px;
		background: #eee;
	}
</style>
