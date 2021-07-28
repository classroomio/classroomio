<script>
  import GroupPresentation32 from 'carbon-icons-svelte/lib/GroupPresentation32';
  import UserSpeaker32 from 'carbon-icons-svelte/lib/UserSpeaker32';
  import Book32 from 'carbon-icons-svelte/lib/Book32';

  let borderBottomGrey = 'border-r-0 border-b border-l-0 border-gray-300';
  let animate = 'transition delay-75 duration-300 ease-in-out';
  let boxes = [
    {
      label: 'Students',
      value: 50,
      icon: 'students',
    },
    {
      label: 'Tutors',
      value: 10,
      icon: 'tutor',
    },
    {
      label: 'Courses',
      value: 20,
      icon: 'courses',
    },
  ];

  let topStudents = [
    {
      id: 1,
      name: 'Brad Traversy',
      score: 97.8,
    },
    {
      id: 2,
      name: 'Ebuka Jacobs',
      score: 96,
    },
    {
      id: 3,
      name: 'Ngozi Okonjo Iwuala',
      score: 95,
    },
    {
      id: 4,
      name: 'Nathaniel Bassey',
      score: 80,
    },
    {
      id: 5,
      name: 'Barack Obama',
      score: 79,
    },
  ];

  let topCourses = [
    {
      title: 'CityBIM Basic Module',
      rating: 5,
    },
    {
      title: 'CityBIM Advanced Module',
      rating: 4.5,
    },
    {
      title: 'Introduction to ClasroomIO',
      rating: 4.2,
    },
    {
      title: 'Advanced Builders Module',
      rating: 4.1,
    },
    {
      title: 'Artificial Intelligence - Basics',
      rating: 4,
    },
  ];
</script>

<div class="root w-full py-10 bg-gray-100">
  <div class="flex items-center justify-evenly max-w-6xl m-auto">
    {#each boxes as box}
      <div
        class="bg-white rounded-md py-4 px-16 active shadow-md hover:shadow-2xl border-2 hover:border-blue-700 cursor-pointer {animate}"
      >
        {#if box.icon === 'students'}
          <UserSpeaker32 class="carbon-icon" />
        {:else if box.icon === 'tutor'}
          <GroupPresentation32 class="carbon-icon" />
        {:else if box.icon === 'courses'}
          <Book32 class="carbon-icon" />
        {/if}
        <p class="text-xl">{box.label}</p>
        <h3 class="text-3xl m-0 my-2">{box.value}</h3>
      </div>
    {/each}
  </div>

  <div class="flex items-center justify-evenly mt-16">
    <div class="table rounded-md bg-white shadow-md">
      <div class="flex border-t-0 {borderBottomGrey} p-3">
        <h3 class="m-0 py-2 pl-2 text-lg">Outstanding students</h3>
      </div>

      {#each topStudents as topStudent, index}
        <div
          class="flex items-center p-3 cursor-pointer {borderBottomGrey} hover:bg-gray-100"
        >
          <span class="mr-2">{index + 1}</span>
          <p class="text-lg">{topStudent.name}</p>
          <span class="flex-grow" />
          <p class="text-lg">{topStudent.score}</p>
        </div>
      {/each}
    </div>

    <div class="table rounded-md bg-white shadow-md">
      <div class="flex border-t-0 {borderBottomGrey} p-3">
        <h3 class="m-0 py-2 pl-2 text-lg">Top rated courses</h3>
      </div>

      {#each topCourses as topCourse, index}
        <div
          class="flex items-center p-3 cursor-pointer {borderBottomGrey} hover:bg-gray-100"
        >
          <span class="mr-2">{index + 1}</span>
          <p class="text-lg">{topCourse.title}</p>
          <span class="flex-grow" />
          <p class="text-lg">{topCourse.rating}</p>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .root {
    min-height: 90vh;
  }

  .table {
    width: 564px;
  }
</style>
