<script>
  import { stores } from "@sapper/app";
  import Expandable from "../../Expandable/index.svelte";
  import PageNav from "../../PageNav/index.svelte";
  // export let lectureId;
  const { page } = stores();

  function handleLecturesClick(goTo) {
    return () => {
      console.log("goto", goTo);
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

<div class="root">
  <PageNav title="React.JS" />
  <div>
    <Expandable
      label="Lectures"
      handleClick={handleLecturesClick("/courses/1/lecture/1")}
    >
      {#each lectures as lecture}
        <a
          class="{(lecture.link === $page.path || !$page.path.length > 3) &&
            'active'} pl-4 py-2"
          href={lecture.link}
        >
          # <span>{lecture.title}</span>
        </a>
      {/each}
    </Expandable>
  </div>
</div>

<style>
  .root {
    height: 90vh;
    display: flex;
    flex-direction: column;
    width: 250px;
    position: sticky;
    top: 0;
    border-right: 1px solid var(--border-color);
    overflow: auto;
  }

  .active {
    background-color: #cae2f9;
    border-left: 3px solid var(--main-primary-color);
  }
</style>
