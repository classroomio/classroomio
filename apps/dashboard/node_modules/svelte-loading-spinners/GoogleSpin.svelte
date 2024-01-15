<script>
	export let size = '40px';
	export let duration = '3s';
	export let pause = false;
	$: styles = [`width: ${size}`, `height: ${size}`].join(';');
</script>

<div
	class="spinner spinner--google"
	class:pause-animation={pause}
	style="--duration: {duration}; {styles}"
/>

<style>
	* {
		overflow: hidden;
		position: relative;
		text-indent: -9999px;
		display: inline-block;
		background: #f86;
		border-radius: 50%;
		transform: rotateZ(90deg);
		transform-origin: 50% 50%;
		animation: plus-loader-background var(--duration) infinite ease-in-out;
	}

	*::after {
		background: #f86;
		border-radius: 50% 0 0 50%;
		content: '';
		position: absolute;
		right: 50%;
		top: 0;
		width: 50%;
		height: 100%;
		transform-origin: 100% 50%;
		animation: plus-loader-top var(--duration) infinite linear;
	}

	*::before {
		background: #fc6;
		border-radius: 50% 0 0 50%;
		content: '';
		position: absolute;
		right: 50%;
		top: 0;
		width: 50%;
		height: 100%;
		transform-origin: 100% 50%;
		animation: plus-loader-bottom var(--duration) infinite linear;
	}
	.pause-animation,
	.pause-animation::before,
	.pause-animation::after {
		animation-play-state: paused;
	}

	@keyframes plus-loader-top {
		2.5% {
			background: #f86;
			transform: rotateY(0deg);
			animation-timing-function: ease-in;
		}

		13.75% {
			background: #ff430d;
			transform: rotateY(90deg);
			animation-timing-function: step-start;
		}

		13.76% {
			background: #ffae0d;
			transform: rotateY(90deg);
			animation-timing-function: ease-out;
		}

		25% {
			background: #fc6;
			transform: rotateY(180deg);
		}

		27.5% {
			background: #fc6;
			transform: rotateY(180deg);
			animation-timing-function: ease-in;
		}

		41.25% {
			background: #ffae0d;
			transform: rotateY(90deg);
			animation-timing-function: step-start;
		}

		41.26% {
			background: #2cc642;
			transform: rotateY(90deg);
			animation-timing-function: ease-out;
		}

		50% {
			background: #6d7;
			transform: rotateY(0deg);
		}

		52.5% {
			background: #6d7;
			transform: rotateY(0deg);
			animation-timing-function: ease-in;
		}

		63.75% {
			background: #2cc642;
			transform: rotateY(90deg);
			animation-timing-function: step-start;
		}

		63.76% {
			background: #1386d2;
			transform: rotateY(90deg);
			animation-timing-function: ease-out;
		}

		75% {
			background: #4ae;
			transform: rotateY(180deg);
		}

		77.5% {
			background: #4ae;
			transform: rotateY(180deg);
			animation-timing-function: ease-in;
		}

		91.25% {
			background: #1386d2;
			transform: rotateY(90deg);
			animation-timing-function: step-start;
		}

		91.26% {
			background: #ff430d;
			transform: rotateY(90deg);
			animation-timing-function: ease-in;
		}

		100% {
			background: #f86;
			transform: rotateY(0deg);
			animation-timing-function: step-start;
		}
	}

	@keyframes plus-loader-bottom {
		0% {
			background: #fc6;
			animation-timing-function: step-start;
		}

		50% {
			background: #fc6;
			animation-timing-function: step-start;
		}

		75% {
			background: #4ae;
			animation-timing-function: step-start;
		}

		100% {
			background: #4ae;
			animation-timing-function: step-start;
		}
	}

	@keyframes plus-loader-background {
		0% {
			background: #f86;
			transform: rotateZ(180deg);
		}

		25% {
			background: #f86;
			transform: rotateZ(180deg);
			animation-timing-function: step-start;
		}

		27.5% {
			background: #6d7;
			transform: rotateZ(90deg);
		}

		50% {
			background: #6d7;
			transform: rotateZ(90deg);
			animation-timing-function: step-start;
		}

		52.5% {
			background: #6d7;
			transform: rotateZ(0deg);
		}

		75% {
			background: #6d7;
			transform: rotateZ(0deg);
			animation-timing-function: step-start;
		}

		77.5% {
			background: #f86;
			transform: rotateZ(270deg);
		}

		100% {
			background: #f86;
			transform: rotateZ(270deg);
			animation-timing-function: step-start;
		}
	}
</style>
