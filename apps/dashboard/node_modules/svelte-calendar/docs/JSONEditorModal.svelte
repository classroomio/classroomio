<script>
	import CrossfadeProvider from '../components/generic/crossfade/CrossfadeProvider.svelte';
	import { storeContextKey } from '../context';
	import autofocus from '../directives/autofocus';
	import blurr from '../directives/blurr';
	import { getContext } from 'svelte';
	const store = getContext(storeContextKey);

	const originalValue = $store.editing.value;
	const path = $store.editing.mapping.path;
	let newValue = $store.editing.newValue;
</script>

<CrossfadeProvider let:key let:send let:receive>
	<form on:submit|stopPropagation|preventDefault={() => store.commit(newValue)}>
		<div
			use:blurr
			on:blurr={() => store.cancelEdit()}
			on:keydown|stopPropagation
			in:receive|local={{ key }}
			out:send|local={{ key }}
			class="default-editor"
		>
			<div class="heading">
				<span class="label">{path}</span>
				<span class="value">{originalValue}</span>
			</div>
			<div class="form">
				<input type="text" bind:value={newValue} use:autofocus={{ delay: 150 }} />
				<button type="submit">save</button>
				<button class="secondary" on:click|preventDefault={() => store.cancelEdit()}>revert</button>
			</div>
		</div>
	</form>
</CrossfadeProvider>

<style>
	.default-editor {
		width: 850px;
		max-width: 100%;
		height: 225px;
		box-shadow: var(--sc-theme-calendar-shadow);
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 3;
		opacity: 1;
		background: var(--sc-theme-calendar-colors-background-primary);
		display: grid;
		grid-template-rows: auto 1fr;
		text-align: left;
		align-items: center;
	}

	.default-editor .heading {
		background: var(--sc-theme-calendar-colors-background-highlight);
		color: #fff;
		display: grid;
		padding: 15px;
		font-size: 1.2em;
	}

	.default-editor .heading .value {
		font-size: 2.4em;
	}

	.default-editor .form {
		width: 80%;
		margin: 0 auto;
		display: grid;
		grid-template-columns: auto auto auto;
		border: 1px solid #333;
		box-shadow: var(--sc-theme-calendar-shadow);
	}

	.default-editor .form > * {
		border: none;
		padding: 15px;
	}

	@media (max-width: 480px) {
		.default-editor .form > * {
			padding: 5px;
		}
	}

	.default-editor .form input {
		outline: none;
		border-right: 1px solid #333;
	}

	button {
		background: var(--sc-theme-calendar-colors-background-highlight);
		color: var(--sc-theme-calendar-colors-text-highlight);
		font-size: 1.3em;
		border: 0;
		cursor: pointer;
		border-radius: 0;
	}

	button.secondary {
		background: var(--sc-theme-calendar-colors-background-primary);
		color: var(--sc-theme-calendar-colors-text-primary);
	}
</style>
