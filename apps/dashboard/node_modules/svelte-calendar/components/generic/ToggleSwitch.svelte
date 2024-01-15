<script>
	export let value = false;
	export let width = '45px';
	export let height = '20px';

	$: containerStyle = [
		`width: ${width}`,
		`height: ${height}`,
		`border-radius: calc(${height} / 2)`
	].join(';');

	$: buttonStyle = [
		`width: ${height}`,
		`height: ${height}`,
		`transform: translateX(${!value ? '0' : `calc(${width} - ${height})`})`
	].join(';');
</script>

<div style={containerStyle} on:click={() => (value = !value)}>
	<button style={buttonStyle} />
</div>

<style>
	div {
		text-align: left;
		background: var(--sc-theme-calendar-colors-background-hover);
		margin: 0 auto;
		display: grid;
	}
	* {
		transition: all 180ms cubic-bezier(1, -0.055, 0.135, 1.07);
	}
	button {
		border: none;
		background: var(--sc-theme-calendar-colors-background-highlight);
		border-radius: 50%;
	}
</style>
