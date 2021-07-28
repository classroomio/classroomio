<script>
  import AddAlt32 from 'carbon-icons-svelte/lib/AddAlt32';
  import IconButton from '../components/IconButton/index.svelte';
  import Avatar from '../components/Avatar/index.svelte';
  let teachers = [
    {
      avatar: 'https://avatars.githubusercontent.com/u/43971542?s=96&v=4',
      name: 'Imed Jaberi',
    },
    {
      avatar: 'https://avatars.githubusercontent.com/u/3624098?s=96&v=4',
      name: 'Andrew Clark',
    },
    {
      avatar: 'https://avatars.githubusercontent.com/u/857709?s=96&v=4',
      name: 'Daniel Lytkin',
    },
  ];

  let students = [
    {
      avatar: 'https://avatars.githubusercontent.com/u/20658625?s=96&v=4',
      name: 'Aissaoui Ahmed',
    },
    {
      avatar: 'https://avatars.githubusercontent.com/u/26669835?s=96&v=4',
      name: 'Mahfoudh Arous',
    },
  ];

  let borderBottom = 'border-r-0 border-b border-l-0';
  function addTeacher() {}
  function addStudent() {}
</script>

<div class="root w-full py-5">
  <div class="max-w-2xl mx-auto my-5">
    <div
      class="flex items-center justify-between {borderBottom} border-blue-700"
    >
      <h3 class="text-3xl text-blue-700">Teachers</h3>
      <IconButton
        toolTipProps={{ title: 'Add', direction: 'right' }}
        onClick={addTeacher}
        selected={true}
      >
        <AddAlt32 class="carbon-icon" />
      </IconButton>
    </div>

    {#each teachers as teacher, index}
      <div
        class="flex items-center px-2 py-3 {teachers[index + 1] &&
          borderBottom} border-gray-300"
      >
        <Avatar src={teacher.avatar} name={teacher.name} />
        <p class="ml-2">{teacher.name}</p>
      </div>
    {/each}
  </div>

  <div class="max-w-2xl mx-auto my-5">
    <div
      class="flex items-center justify-between {borderBottom} border-blue-700"
    >
      <h3 class="text-3xl text-blue-700">Students</h3>
      <IconButton
        toolTipProps={{ title: 'Add', direction: 'right' }}
        onClick={addStudent}
        selected={true}
      >
        <AddAlt32 class="carbon-icon" />
      </IconButton>
    </div>

    {#each students as student, index}
      <div
        class="flex items-center px-2 py-3 {students[index + 1] &&
          borderBottom} border-gray-300"
      >
        <Avatar src={student.avatar} name={student.name} />
        <p class="ml-2">{student.name}</p>
      </div>
    {/each}
  </div>
</div>

<style>
  .root {
    min-height: 90vh;
  }
</style>
