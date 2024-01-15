<script>
	import { onMount, tick } from 'svelte';

	const rand = (start, end) => Math.random() * (end - start) + start;
	const wrap = (val, limit) => {
		if (val < 0) return limit;
		if (val > limit) return 0;
		return val;
	};

	let w, h;
	let circles = [];

	onMount(() => {
		let rafId;
		circles = Array(50)
			.fill(0)
			.map((_, i) => {
				const r = rand(0.01, 8);
				return {
					cx: rand(0, w),
					cy: rand(h, h * 1.1),
					vx: rand(-0.25, 0.25),
					vy: rand(-0.5, -5.8) / (r * 3),
					r
				};
			});

		const animate = async (t = Date.now()) => {
			circles = circles.map((circle) => ({
				...circle,
				cx: wrap(circle.cx + circle.vx, w + circle.r * 2),
				cy: wrap(circle.cy + circle.vy, h + circle.r * 2)
			}));
			await tick();
			rafId = requestAnimationFrame(animate);
		};
		animate();
		return cancelAnimationFrame(rafId);
	});
</script>

<div bind:offsetWidth={w} bind:offsetHeight={h}>
	<svg>
		{#each circles as { cx, cy, r }}
			<circle {cx} {cy} {r} />
		{/each}
	</svg>
</div>

<style>
	div {
		display: grid;
		pointer-events: none;
	}
	svg {
		height: 100%;
		width: 100%;
	}
	svg circle {
		fill: #0f0b0c;
	}
</style>
