<script context="module">
  import marked from "marked";
  import Vote from "../../components/Vote.svelte";
  import HashTags from "../../components/HashTags.svelte";
  import TextEditor from "../../components/TextEditor.svelte";
  import CheckmarkOutline20 from "carbon-icons-svelte/lib/CheckmarkOutline20";

  let userComment = "";

  export async function preload({ params }) {
    // the `id` parameter is available because
    // this file is called [id].svelte
    const res = await this.fetch(`discussion/${params.id}.json`);
    const data = await res.json();

    if (res.status === 200) {
      return { discussion: data };
    } else {
      this.error(res.status, data.message);
    }
  }
</script>

<script>
  export let discussion;
</script>

<svelte:head>
  <title>{discussion.title}</title>
</svelte:head>

<div class="root lg:w-3/5 mx-auto md:mx-10 lg:mb-20">
  <div class="flex items-start">
    <Vote value={discussion.votes} />
    <h2 class="text-3xl mb-8">{discussion.title}</h2>
  </div>
  <div class="my-1 px-1 rounded-lg border border-1 border-gray">
    <header class="flex items-center justify-between leading-none p-2">
      <a
        class="flex items-center no-underline hover:underline text-black"
        href="/"
      >
        <img
          alt="Placeholder"
          class="block rounded-full"
          src="https://picsum.photos/32/32/?random"
        />
        <p class="ml-2 text-sm">{discussion.author.name}</p>
        <p class="ml-2 text-sm text-gray-500">12h ago</p>
      </a>
    </header>
    <section class="prose prose-sm sm:prose p-2">
      {@html marked(discussion.question)}
    </section>
    <section class="p-2">
      <HashTags tags={discussion.tags} />
    </section>
  </div>

  <div class="my-8"><strong>{discussion.comments.length} ответы</strong></div>

  {#each discussion.comments as comment}
    <div class="my-5 px-1 flex items-start">
      <Vote value={comment.votes} />
      <div class="w-full rounded-lg border border-1 border-gray">
        <header class="flex items-center justify-between leading-none p-2">
          <a
            class="flex items-center no-underline hover:underline text-black"
            href="/"
          >
            <img
              alt="Placeholder"
              class="block rounded-full"
              width="24"
              height="20"
              src={comment.avatar}
            />
            <p class="ml-2 text-sm">{comment.name}</p>
            <p class="ml-2 text-sm text-gray-500">12h ago</p>
          </a>

          <CheckmarkOutline20 />
        </header>
        <article class="prose prose-sm sm:prose p-2">
          {@html marked(comment.comment)}
        </article>
      </div>
    </div>
  {/each}

  <hr />
  <TextEditor value={userComment} placeholder="Предлогайте ваш ответ" />
</div>

<style>
  .root {
    margin: 15px 5px;
  }
</style>
