<script>import clsx from "clsx";
export let href = "";
export let title = "";
export let description = "";
const as = href ? "a" : "div";
$:
  arrowClass = clsx(
    href && "text-brand transition-all duration-100 opacity-0 group-hover:opacity-100 translate group-hover:translate-x-0 -translate-x-3",
    !href ? "hidden" : "inline-block"
  );
</script>

<svelte:element this={as} class={clsx('card', href && 'hover:border-brand cursor-pointer')} {href}>
	{#if $$slots['icon']}
		<div class="h-6 w-6 text-brand">
			<slot name="icon" />
		</div>
	{/if}
	<h2 class="heading">
		<span>{title}</span>
		{#if href}
			<span class={arrowClass}>-></span>
		{/if}
	</h2>
	{#if description}
		<span class="mt-1 font-normal text-soft">
			<p>{description}</p>
		</span>
	{/if}
</svelte:element>

<style>
	.card {
		/* block not-prose font-normal group relative my-2 ring-2 ring-transparent rounded-lg border border-border overflow-hidden px-6 py-5 w-full */
		display: block;
		font-family: 'Inter', sans-serif;
		font-weight: 400;
		position: relative;
		margin-top: 0.5rem;
		margin-bottom: 0.5rem;
		border-radius: 0.5rem;
		border: 1px solid #e5e7eb;
		border-color: var(--kd-color-border);
		overflow: hidden;
		padding-left: 1.5rem;
		padding-right: 1.5rem;
		padding-top: 1.25rem;
		padding-bottom: 1.25rem;
		width: 100%;
	}

	.card:hover {
		border-color: var(--kd-color-brand);
	}

	.card .heading {
		/* font-semibold text-xl dark:text-white mt-4 */
		font-weight: 600;
		font-size: 1.125rem;
		margin-top: 1rem;
	}

	.dark .card .heading {
		color: #fff;
	}
</style>
