<script>
	import { InlineCalendar } from '../../index';
	import { base } from '$app/paths';

	const theme = {
		calendar: {
			colors: {
				background: {
					highlight: 'purple'
				}
			}
		}
	};
</script>

<InlineCalendar {theme} />

<!-- Example Notes -->
<p>
	See <a href="{base}/docs/theme-editor/light">theme-editor page</a> to design your own theme.
</p>
