<script lang="ts">
	import type { Icon } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import { NodeViewWrapper } from 'svelte-tiptap';

	interface Props {
		icon?: typeof Icon;
		title?: string;
		onClick?: () => void;
		class?: string;
		children?: Snippet<[]>;
	}

	const { icon, title, onClick, class: className = '', children }: Props = $props();
</script>

<NodeViewWrapper
	as="div"
	contenteditable="false"
	class={`media-placeholder ${className}`}
	onclick={onClick}
	style="user-select: none;"
>
	{#if !children && icon && title}
		{@const Icon = icon}
		<Icon />
		<div contenteditable="false">{title}</div>
	{/if}
	{@render children?.()}
</NodeViewWrapper>
