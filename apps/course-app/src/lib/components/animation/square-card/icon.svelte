<script lang="ts">
	import { cn } from '$lib/utils';

	let className: any = '';
	export { className as class };
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	fill="none"
	viewBox="0 0 24 24"
	width={24}
	height={24}
	stroke-width="1"
	stroke-linecap="round"
	stroke="currentColor"
	class={cn('absolute text-black  dark:text-white', className)}
	{...$$restProps}
>
	<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m6-6H6" />
</svg>
