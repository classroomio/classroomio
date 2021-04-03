<script>
	import Space from "./Space.svelte";
	import NewQuestion from "./NewQuestion.svelte";
	export let segment;
</script>

<style>
	nav {
		border-bottom: 1px solid rgba(255, 62, 0, 0.1);
		font-weight: 300;
		padding: 0 1em;
		display: flex;
		position: sticky;
		top: 0px;
		background-color: #fff;
		z-index: 1;
	}

	ul {
		margin: 0;
		padding: 0;
	}

	/* clearfix */
	ul::after {
		content: "";
		display: block;
		clear: both;
	}

	li {
		display: block;
		float: left;
	}

	[aria-current] {
		position: relative;
		display: inline-block;
	}

	[aria-current]::after {
		position: absolute;
		content: "";
		width: calc(100% - 1em);
		height: 2px;
		background-color: #3182ce;
		display: block;
		bottom: -1px;
	}

	a {
		text-decoration: none;
		padding: 1em 0.5em;
	}
</style>

<nav>
	<ul>
		<li>
			<a
				class="block"
				aria-current={segment === undefined || segment === 'discussion' ? 'page' : undefined}
				href=".">UniDiscuss</a>
		</li>
	</ul>
	<Space />
	<ul class="flex items-center">
		<li>
			<NewQuestion />
		</li>
		<li>
			<a
				class="flex items-center"
				href="https://t.me/unidiscuss"
				target="_blank">
				<img
					alt="File:Telegram logo.svg"
					class="mr-1"
					src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Telegram_alternative_logo.svg/50px-Telegram_alternative_logo.svg.png"
					decoding="async"
					width="25"
					height="25"
					srcset="https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Telegram_alternative_logo.svg/50px-Telegram_alternative_logo.svg.png 1.5x, https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Telegram_logo.svg/1024px-Telegram_logo.svg.png 2x"
					data-file-width="25"
					data-file-height="25" />
				<span>Канал</span>
			</a>
		</li>
		<li>
			<a
				class="block"
				aria-current={segment === 'profile' ? 'page' : undefined}
				href="profile">Войти</a>
		</li>
	</ul>
</nav>
