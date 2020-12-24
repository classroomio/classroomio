<script>
	import ArrowUp16 from "carbon-icons-svelte/lib/ArrowUp16";
	import Chip from "../components/Chip.svelte";
	const discussions = [
		{
			id: 1,
			title: 'How do I pass Anicimov?',
			author: {
				name: 'rotimibest',
			},
			tags: [
				'ибэит', 'икс'
			],
			answered: false,
			comments: 10
		},
		{
			id: 2,
			title: 'Where do I find the nearest restaurant?',
			author: {
				name: 'attronaldo',
			},
			tags: [
				'иибрт', 'иее'
			],
			answered: false,
			comments: 2
		},
		{
			id: 3,
			title: 'Who is Nikolenko?',
			author: {
				name: 'donald',
			},
			tags: [
				'ибэит', 'иее', 'иибрт', 'ИПИГ'
			],
			answered: false,
			comments: 10
		},
		{
			id: 4,
			title: 'Archive discussion button',
			author: {
				name: 'acharlesvv',
			},
			tags: [
				'ИЭКСУ', 'ИМБТ', 'ИМИ', 'ИПТДМ', 'ИИИР', 'ГФ', 'ХТФ', 'ИДЗО', 'УИИ', 'УНИ'
			],
			answered: false,
			comments: 10
		}
	]
</script>

<svelte:head>
	<title>Unidiscuss - Help students in your university</title>
</svelte:head>
<div class="root">
	{#each discussions as discussion}
		<div class="discussion-box">
			<div class="discussion-vote">
				<ArrowUp16 />
				<Chip value="{discussion.comments}" />
			</div>
			<div class="discussion-topic-author">
				<h4><a rel="prefetch" href="blog/{discussion.id}">{discussion.title}</a></h4>
				<span>{discussion.author.name} asked 1 day ago</span>
			</div>
		</div>
	{/each}
</div>

<style>
	.root {
		margin: 0 auto;
	}

	.discussion-box {
		border-bottom: 1px solid #eaecef;
		display: flex;
		align-items: center;
		padding: 16px;
	}

	h4 {
		font-size: 16px;
		font-weight: 900;
		word-break: break-word;
		overflow-wrap: break-word;
		margin: 0;
	}

	.discussion-vote {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 56px;
		justify-content: center;
		margin-right: 10px;
	}

	.discussion-topic-author span{
		color: #586069;
		font-size: 12px;;
	}
</style>
