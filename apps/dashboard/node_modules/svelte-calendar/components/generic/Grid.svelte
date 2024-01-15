<script>
	export let template = 'repeat(4, 1fr) / repeat(3, 1fr)';
</script>

<div class="grid" style="grid-template: {template};">
	<slot />
</div>

<style>
	.grid {
		display: grid;
		background: var(--sc-theme-calendar-colors-border);
		row-gap: 1px;
		column-gap: 1px;
		height: 100%;
	}
	.grid > :global(*) {
		font-size: var(--sc-theme-calendar-font-regular);
		text-decoration: none;
		color: var(--sc-theme-calendar-colors-text-primary);
		transition: all 180ms ease-out;
		background: var(--sc-theme-calendar-colors-background-primary);
		display: grid;
		text-align: center;
		align-items: center;
	}

	@media (max-width: 720px) {
		.grid > :global(*) {
			font-size: calc(var(--sc-theme-calendar-font-regular) * 0.75);
		}
	}

	.grid > :global(*:hover) {
		background: var(--sc-theme-calendar-colors-background-hover);
	}
	.grid > :global(*.selected) {
		background: var(--sc-theme-calendar-colors-background-highlight);
		color: var(--sc-theme-calendar-colors-text-highlight);
		opacity: 1;
	}
	.grid > :global(*.outsider) {
		opacity: var(--sc-theme-calendar-grid-outsiderOpacity);
	}
	.grid > :global(*.disabled) {
		opacity: var(--sc-theme-calendar-grid-disabledOpacity);
	}
	.grid > :global(*.disabled:hover) {
		background: var(--sc-theme-calendar-colors-background-primary);
		cursor: default;
	}
</style>
