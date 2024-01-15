<script>
	import { base } from '$app/paths';
	import { InlineCalendar, themes } from '../../index';
	const { dark: theme } = themes;
</script>

<InlineCalendar {theme} />

<!-- Example Notes -->
<p>Not your cup of tea? <a href="{base}/docs/theme-editor/light">Design your own theme.</a></p>
