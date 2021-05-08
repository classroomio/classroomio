<script>
  import { stores, goto } from "@sapper/app";
  import Expandable from "../../Expandable/index.svelte";
  import PageNav from "../../PageNav/index.svelte";
  // export let lectureId;
  const { page } = stores();

  function handleMainGroupClick(href) {
    return () => {
      goto(href);
    };
  }

  const lectures = [
    {
      title: "Lecture 1",
      link: "/courses/1/lecture/1",
    },
    {
      title: "Lecture 2",
      link: "/courses/1/lecture/2",
    },
    {
      title: "Lecture 3",
      link: "/courses/1/lecture/3",
    },
    {
      title: "Lecture 4",
      link: "/courses/1/lecture/4",
    },
    {
      title: "Lecture 5",
      link: "/courses/1/lecture/5",
    },
  ];
</script>

<style>
  .root {
    height: 90vh;
    display: flex;
    flex-direction: column;
    width: 20%;
    max-width: 250px;
    position: sticky;
    top: 0;
    border-right: 1px solid var(--border-color);
    overflow: auto;
  }

  .active {
    background-color: #cae2f9;
    border-left: 3px solid var(--main-primary-color);
    padding-left: 1.5rem;
  }

  .item:hover {
    background-color: #cae2f9;
  }
</style>

<div class="root">
  <PageNav title="React.JS" />
  <div>
    <Expandable
      label="Overview"
      handleClick={handleMainGroupClick('/courses/1')}
      isGroupActive={$page.path === '/courses/1'}
      hideSortIcon />
    <Expandable label="Lectures">
      {#each lectures as lecture}
        <a
          class="item {(lecture.link === $page.path || !$page.path.length > 3) && 'active'} pl-7 py-2"
          href={lecture.link}>
          #
          <span>{lecture.title}</span>
        </a>
      {/each}
    </Expandable>
    <Expandable
      label="People"
      handleClick={handleMainGroupClick('/courses/1/people')}
      isGroupActive={$page.path === '/courses/1/people'}
      hideSortIcon />
    <Expandable
      label="Timetable"
      handleClick={handleMainGroupClick('/courses/1/timetable')}
      isGroupActive={$page.path === '/courses/1/timetable'}
      hideSortIcon />
    <Expandable
      label="Scoreboard"
      handleClick={handleMainGroupClick('/courses/1/score')}
      isGroupActive={$page.path === '/courses/1/score'}
      hideSortIcon />
    <Expandable
      label="Home tasks"
      handleClick={handleMainGroupClick('/courses/1/hometasks')}
      isGroupActive={$page.path === '/courses/1/hometasks'}
      hideSortIcon />
  </div>
</div>
