import { Context } from 'runed';
import type { ReadableBoxedValues, WritableBoxedValues } from 'svelte-toolbelt';
import type { Tabs as TabsPrimitive } from 'bits-ui';
import { crossfade } from 'svelte/transition';

export const [send, receive] = crossfade({
	duration: (d) => Math.sqrt(d * 200)
});

type UnderlineTabsRootProps = WritableBoxedValues<{
	value: string;
}> &
	ReadableBoxedValues<{
		id: string;
	}>;

class UnderlineTabsRootState {
	hoveredTab = $state<string | null>(null);
	isHovered = $state(false);
	constructor(readonly opts: UnderlineTabsRootProps) {
		this.hoveredTab = this.opts.value.current;
	}
}

type UnderlineTabsTriggerProps = ReadableBoxedValues<{
	value: string;
	onmouseenter: TabsPrimitive.TriggerProps['onmouseenter'];
	onmouseleave: TabsPrimitive.TriggerProps['onmouseleave'];
	onfocus: TabsPrimitive.TriggerProps['onfocus'];
	onblur: TabsPrimitive.TriggerProps['onblur'];
}>;

class UnderlineTabsTriggerState {
	constructor(
		readonly opts: UnderlineTabsTriggerProps,
		readonly rootState: UnderlineTabsRootState
	) {}

	handleFocus() {
		this.rootState.isHovered = true;
		this.rootState.hoveredTab = this.opts.value.current;
	}

	handleBlur() {
		if (this.rootState.hoveredTab === this.opts.value.current) {
			this.rootState.isHovered = false;
		}
	}

	onmouseenter(e: Parameters<NonNullable<TabsPrimitive.TriggerProps['onmouseenter']>>[0]) {
		this.handleFocus();
		this.opts.onmouseenter.current?.(e);
	}

	onmouseleave(e: Parameters<NonNullable<TabsPrimitive.TriggerProps['onmouseleave']>>[0]) {
		this.handleBlur();
		this.opts.onmouseleave.current?.(e);
	}

	onfocus(e: Parameters<NonNullable<TabsPrimitive.TriggerProps['onfocus']>>[0]) {
		this.handleFocus();
		this.opts.onfocus.current?.(e);
	}

	onblur(e: Parameters<NonNullable<TabsPrimitive.TriggerProps['onblur']>>[0]) {
		this.handleBlur();

		this.opts.onblur.current?.(e);
	}

	props = $derived.by(() => ({
		value: this.opts.value.current,
		onmouseenter: this.onmouseenter.bind(this),
		onmouseleave: this.onmouseleave.bind(this),
		onfocus: this.onfocus.bind(this),
		onblur: this.onblur.bind(this)
	}));
}

const ctx = new Context<UnderlineTabsRootState>('underline-tabs-root-ctx');

export function useUnderlineTabs(opts: UnderlineTabsRootProps) {
	return ctx.set(new UnderlineTabsRootState(opts));
}

export function useUnderlineTabsTrigger(opts: UnderlineTabsTriggerProps) {
	return new UnderlineTabsTriggerState(opts, ctx.get());
}
