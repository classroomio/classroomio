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
      title: "Вводный урок. Soft skills",
      link: "/courses/1/lecture/1",
    },
    {
      title: "Введение в ReactJS",
      link: "/courses/1/lecture/2",
    },
    {
      title: "Компоненты",
      link: "/courses/1/lecture/3",
    },
    {
      title: "Состояние компонентов и пропсы",
      link: "/courses/1/lecture/4",
    },
    {
      title: "Жизненный цикл",
      link: "/courses/1/lecture/5",
    },
  ];

  function getLectureNo(index) {
    if (index < 9) {
      return `00${index}`;
    }

    return `0${index}`;
  }
</script>

<div class="root">
  <PageNav title="React.JS" />
  <div>
    <Expandable
      label="Overview"
      handleClick={handleMainGroupClick("/courses/1")}
      isGroupActive={$page.path === "/courses/1"}
      hideSortIcon
    />
    <Expandable label="Lectures">
      {#each lectures as lecture, index}
        <a
          class="item {(lecture.link === $page.path ||
            !$page.path.length > 3) &&
            'active'} pl-7 py-2"
          href={lecture.link}
        >
          <span class="course-counter"> {getLectureNo(index + 1)} </span>
          <span>{lecture.title}</span>
        </a>
      {/each}
    </Expandable>
    <Expandable
      label="People"
      handleClick={handleMainGroupClick("/courses/1/people")}
      isGroupActive={$page.path === "/courses/1/people"}
      hideSortIcon
    />
    <Expandable
      label="Timetable"
      handleClick={handleMainGroupClick("/courses/1/timetable")}
      isGroupActive={$page.path === "/courses/1/timetable"}
      hideSortIcon
    />
    <Expandable
      label="Scoreboard"
      handleClick={handleMainGroupClick("/courses/1/score")}
      isGroupActive={$page.path === "/courses/1/score"}
      hideSortIcon
    />
    <Expandable
      label="Home tasks"
      handleClick={handleMainGroupClick("/courses/1/hometasks")}
      isGroupActive={$page.path === "/courses/1/hometasks"}
      hideSortIcon
    />
  </div>
</div>

<style lang="scss">
  .root {
    height: 90vh;
    display: flex;
    flex-direction: column;
    width: 360px;
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
  .course-counter {
    font-family: SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace;
    background-color: inherit;
    font-size: 0.6875rem;
    font-weight: 600;
    line-height: 1.5;
    margin-right: 1.5rem;
  }

  .item {
    font-size: 0.875rem;
    &:hover {
      background-color: #cae2f9;
    }
  }
</style>
