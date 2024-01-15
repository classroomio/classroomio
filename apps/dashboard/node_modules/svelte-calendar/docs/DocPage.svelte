<script>
	import { getStores } from '$app/stores';

	export let padContents = true;

	const { page } = getStores();
</script>

<div class="grid">
	<h1 class="pad">
		<slot name="title">{$page.path}</slot>
	</h1>
	<div class:pad={padContents}>
		<slot>
			<div>
				Lorem ipsum, dolor sit amet consectetur adipisicing elit. Voluptas, esse! Expedita
				doloremque esse sint modi possimus nisi aperiam quasi, culpa pariatur praesentium ea animi
				voluptatibus soluta repellendus, cum qui laudantium?
			</div>
		</slot>
	</div>
</div>

<style>
	.grid {
		display: grid;
		grid-template-rows: auto 1fr;
	}

	.pad {
		padding: 20px;
	}

	h1 {
		font-size: 5em;
		margin: 0;
		background: var(--sc-theme-calendar-colors-background-highlight);
		color: var(--sc-theme-calendar-colors-text-highlight);
	}

	@media (max-width: 720px) {
		h1 {
			font-size: 2.5em;
		}

		.pad {
			padding: 10px 20px;
		}
	}
</style>
