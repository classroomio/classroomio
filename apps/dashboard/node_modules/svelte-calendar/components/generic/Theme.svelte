<script>
	import { light as lightTheme } from '../../config/theme';
	import { themeContextKey } from '../../context';
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';

	export let theme = {};
	export let appliedTheme;
	export let prefix = '--sc-theme';
	export let defaultTheme = lightTheme;

	const store = writable();

	setContext(themeContextKey, store);

	const getStyle = (obj) =>
		Object.entries(obj)
			.map(([k, v]) => `${prefix}-${k}: ${v}`)
			.join(';');

	const getTheme = (defaults, overrides = {}, base = '') =>
		Object.entries(defaults).reduce((acc, [k, v]) => {
			if (typeof v === 'object')
				return { ...acc, ...getTheme(v, overrides[k], [base, k].filter(Boolean).join('-')) };
			return { ...acc, [[base, k].filter(Boolean).join('-')]: overrides[k] || v };
		}, {});

	$: appliedTheme = getTheme(defaultTheme, theme);
	$: style = getStyle(appliedTheme);
	$: store.set(appliedTheme);
</script>

<slot {appliedTheme} {style} />
