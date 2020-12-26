<script>
	import Space from "./Space.svelte";
	export let segment;
</script>

<style>
	nav {
		border-bottom: 1px solid rgba(255,62,0,0.1);
		font-weight: 300;
		padding: 0 1em;
		display: flex;
	}

	ul {
		margin: 0;
		padding: 0;
	}

	/* clearfix */
	ul::after {
		content: '';
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
		content: '';
		width: calc(100% - 1em);
		height: 2px;
		background-color: #3182ce;
		display: block;
		bottom: -1px;
	}

	a {
		text-decoration: none;
		padding: 1em 0.5em;
		display: block;
	}
</style>

<nav>
	<ul>
		<li><a aria-current="{(segment === undefined || segment === 'discussion') ? 'page' : undefined}" href=".">UniDiscuss</a></li>
	</ul>
	<Space/>
	<ul>
		<!-- <li><a aria-current="{segment === 'ask' ? 'page' : undefined}" href="ask">Ask</a></li> -->
		<li><a aria-current="{segment === 'profile' ? 'page' : undefined}" href="profile">Профиль</a></li>
	</ul>
</nav>
