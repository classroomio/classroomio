<script>
  import { stores } from "@sapper/app";
  import AddComment20 from "carbon-icons-svelte/lib/AddComment20";
  import Vote from "../components/Vote/index.svelte";
  import Space from "../components/Space/index.svelte";
  import HashTags from "../components/HashTags/index.svelte";
  import PageNav from "../components/PageNav/index.svelte";

  function getDiscussion(filterBy, allDiscussions) {
    switch (filterBy) {
      case "popular":
        return allDiscussions.filter((a, i) => i >= 0 && i < 2);
      case "recent":
        return allDiscussions.filter((a, i) => i >= 2 && i < 5);
      case "upvoted":
        return allDiscussions.filter((a, i) => i > 4 && i < 8);
      default:
        return allDiscussions;
    }
  }

  const { page } = stores();
  let filterBy = "";
  let discussions = [];

  $: filterBy = $page.query.filter || "popular";

  const _allDiscussions = [
    {
      id: 1,
      title: "How do I pass Anicimov?",
      author: {
        name: "rotimibest",
      },
      tags: ["ибэит", "икс"],
      answered: false,
      comments: 10,
      votes: 10,
    },
    {
      id: 2,
      title:
        "Where do I find the nearest restaurant. Where do I find the nearest restaurant?. Where do I find the nearest restaurant? Where do I find the nearest restaurant?",
      author: {
        name: "attronaldo",
      },
      tags: ["иибрт", "иее"],
      answered: false,
      comments: 2,
      votes: 2,
    },
    {
      id: 3,
      title: "Who is Nikolenko?",
      author: {
        name: "donald",
      },
      tags: ["ибэит", "иее", "иибрт", "ИПИГ"],
      answered: false,
      comments: 10,
      votes: 10,
    },
    {
      id: 4,
      title: "Archive discussion button",
      author: {
        name: "acharlesvv",
      },
      tags: [
        "ИЭКСУ",
        "ИМБТ",
        "ИМИ",
        "ИПТДМ",
        "ИИИР",
        "ГФ",
        "ХТФ",
        "ИДЗО",
        "УИИ",
        "УНИ",
      ],
      answered: false,
      comments: 15,
      votes: 15,
    },
    {
      id: 1,
      title: "How do I pass Anicimov?",
      author: {
        name: "rotimibest",
      },
      tags: ["ибэит", "икс"],
      answered: false,
      comments: 7,
      votes: 7,
    },
    {
      id: 2,
      title: "Where do I find the nearest restaurant?",
      author: {
        name: "attronaldo",
      },
      tags: ["иибрт", "иее"],
      answered: false,
      comments: 4,
      votes: 4,
    },
    {
      id: 3,
      title: "Who is Nikolenko?",
      author: {
        name: "donald",
      },
      tags: ["ибэит", "иее", "иибрт", "ИПИГ"],
      answered: false,
      comments: 100,
      votes: 100,
    },
    {
      id: 4,
      title: "Archive discussion button",
      author: {
        name: "acharlesvv",
      },
      tags: [
        "ИЭКСУ",
        "ИМБТ",
        "ИМИ",
        "ИПТДМ",
        "ИИИР",
        "ГФ",
        "ХТФ",
        "ИДЗО",
        "УИИ",
        "УНИ",
      ],
      answered: false,
      comments: 5,
      votes: 5,
    },
  ];
  const allDiscussions = [];

  _allDiscussions.forEach((d, i) => {
    allDiscussions.push(d, _allDiscussions[_allDiscussions.length - (i + 1)]);
  });

  $: discussions = getDiscussion(filterBy, allDiscussions);
</script>

<style>
  .root {
    max-width: 600px;
    margin: 0 auto;
    border-left: 1px solid var(--border-color);
    border-right: 1px solid var(--border-color);
  }
  .discussion-box {
    /* border: 1px solid var(--border-color); */
    display: flex;
    align-items: flex-start;
    padding: 10px 15px;
    /* border-radius: 10px; */
    margin: 0px auto;
    border-bottom: 1px solid #e2e8f0;
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
  .discussion-topic-author span {
    color: #586069;
    font-size: 12px;
  }
</style>

<svelte:head>
  <title>Unidiscuss - Help students in your university</title>
</svelte:head>
<div class="root md:w-3/4 mx-auto md:mb-20">
  <PageNav
    title="Talks"
    addButtonHref="/ask"
    addButtonLabel="Ask"
    navItems={[{ label: 'Popular', isActive: filterBy === 'popular', href: '?filter=popular' }, { label: 'Recent', isActive: filterBy === 'recent', href: '?filter=recent' }, { label: 'Upvoted', isActive: filterBy === 'upvoted', href: '?filter=upvoted' }]} />
  {#each discussions as discussion}
    <div class="discussion-box">
      <Vote value={discussion.votes} />
      <div class="discussion-topic-author">
        <h4>
          <a
            rel="prefetch"
            href="discussion/{discussion.id}">{discussion.title}</a>
        </h4>
        <span>{discussion.author.name} asked 1 day ago</span>
        <HashTags tags={discussion.tags} />
      </div>
      <Space />
      <div class="flex items-center">
        <AddComment20 />
        <span>{discussion.comments}</span>
      </div>
    </div>
  {/each}
</div>
