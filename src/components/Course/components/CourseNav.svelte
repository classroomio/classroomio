<script>
  import { stores, goto } from "@sapper/app";
  import Expandable from "../../Expandable/index.svelte";
  import PageNav from "../../PageNav/index.svelte";
  import { getNavItemRoute, getLectureRoute, getLectureNo } from "../function";

  // export let lectureId;
  export let courseId;

  const { page } = stores();

  function handleMainGroupClick(href) {
    return () => {
      goto(href);
    };
  }

  const navItems = [
    {
      label: "Overview",
      to: getNavItemRoute(courseId),
      hideSortIcon: true,
    },
    {
      label: "Lectures",
      to: getLectureRoute(courseId),
      hideSortIcon: false,
      items: [
        {
          id: 1,
          title: "Вводный урок. Soft skills",
          to: getLectureRoute(courseId, 1),
        },
        {
          id: 2,
          title: "Введение в ReactJS",
          to: getLectureRoute(courseId, 2),
        },
        {
          id: 3,
          title: "Компоненты",
          to: getLectureRoute(courseId, 3),
        },
        {
          id: 4,
          title: "Состояние компонентов и пропсы",
          to: getLectureRoute(courseId, 4),
        },
        {
          id: 5,
          title: "Жизненный цикл",
          to: getLectureRoute(courseId, 5),
        },
      ],
    },
    {
      label: "People",
      to: getNavItemRoute(courseId, "people"),
      hideSortIcon: true,
    },
    {
      label: "Timetable",
      to: getNavItemRoute(courseId, "timetable"),
      hideSortIcon: true,
    },
    {
      label: "Scoreboard",
      to: getNavItemRoute(courseId, "scoreboard"),
      hideSortIcon: true,
    },
    {
      label: "Hometasks",
      to: getNavItemRoute(courseId, "hometasks"),
      hideSortIcon: true,
    },
  ];
</script>

<div class="root">
  <PageNav title="React.JS" />
  <div>
    {#each navItems as navItem}
      <Expandable
        label={navItem.label}
        handleClick={handleMainGroupClick(navItem.to)}
        isGroupActive={$page.path === navItem.to}
        hideSortIcon={navItem.hideSortIcon}
      >
        {#if Array.isArray(navItem.items)}
          {#each navItem.items as item, index}
            <a
              class="item flex items-center {(item.to === $page.path ||
                !$page.path.length > 3) &&
                'active'} pl-7 py-2"
              href={item.to}
            >
              <span class="course-counter"> {getLectureNo(index + 1)} </span>
              <span>{item.title}</span>
            </a>
          {/each}
        {/if}
      </Expandable>
    {/each}
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
