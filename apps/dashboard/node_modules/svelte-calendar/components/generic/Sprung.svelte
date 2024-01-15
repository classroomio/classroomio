<script>
	import { spring } from 'svelte/motion';

	export let value;

	const stiffness = 0.3;
	const damping = 0.55;

	const sprung = spring(value, { stiffness, damping });
	let intiailized = false;

	$: {
		if (intiailized) {
			sprung.set(value);
		} else {
			intiailized = true;
		}
	}
</script>

<slot {...$sprung} />
