<script>
  import AddComment20 from "carbon-icons-svelte/lib/AddComment20";
	import Vote from "../components/Vote.svelte";
	import Space from "../components/Space.svelte";
	import NewQuestion from "../components/NewQuestion.svelte";

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
			comments: 10,
			votes: 10,
		},
		{
			id: 2,
			title: 'Where do I find the nearest restaurant. Where do I find the nearest restaurant?. Where do I find the nearest restaurant? Where do I find the nearest restaurant?',
			author: {
				name: 'attronaldo',
			},
			tags: [
				'иибрт', 'иее'
			],
			answered: false,
			comments: 2,
			votes: 2,
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
			comments: 10,
			votes: 10,
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
			comments: 15,
			votes: 15,
    },
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
			comments: 7,
			votes: 7,
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
			comments: 4,
			votes: 4,
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
			comments: 100,
			votes: 100,
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
			comments: 5,
			votes: 5,
		}
	];
</script>

<svelte:head>
	<title>Unidiscuss - Help students in your university</title>
</svelte:head>
<div class="md:w-3/4 mx-auto md:mb-20 md:pr-5">
  <div class="flex justify-end mb-5">
    <NewQuestion />
  </div>
	{#each discussions as discussion}
		<div class="discussion-box">
      <Vote value="{discussion.votes}" />
			<div class="discussion-topic-author">
				<h4><a rel="prefetch" href="discussion/{discussion.id}">{discussion.title}</a></h4>
				<span>{discussion.author.name} asked 1 day ago</span>
      </div>
      <Space />
      <div class="flex items-center">
        <AddComment20 />
        <span>{discussion.comments}</span>
      </div>
		</div>
	{/each}
</div>

<style>
	.discussion-box {
		border-top: 1px solid #eaecef;
		display: flex;
		align-items: flex-start;
		padding: 16px;
	}

	h4 {
		font-size: 16px;
		font-weight: 900;
		word-break: break-word;
		overflow-wrap: break-word;
		margin: 0;
	}

  .discussion-topic-author {
    margin-right: 20px;
  }
	.discussion-topic-author span{
		color: #586069;
		font-size: 12px;;
  }
</style>
