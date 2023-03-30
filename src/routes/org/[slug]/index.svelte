<script context="module">
  export async function preload({ params }) {
    return {
      orgName: params.slug,
    };
  }
</script>

<script lang="ts">
  import { goto } from '@sapper/app';
  import PrimaryButton from '../../../components/PrimaryButton/index.svelte';
  import Avatar from '../../../components/Avatar/index.svelte';
  import Schedule from '../../../components/Org/Schedule.svelte';

  export let orgName: string;

  let orgLink = '';

  function createCourse() {
    goto(`${orgLink}/courses?create=true`);
  }

  const boxes = [
    {
      label: 'Revenue (NGN)',
      value: '0.00',
    },
    {
      label: 'Number of sales',
      value: 0,
    },
    {
      label: 'Number of courses',
      value: 0,
    },
    {
      label: 'Total students',
      value: 0,
    },
  ];
  const activities = [
    {
      avatar:
        'https://koxqonvbkeakwvmdegcf.supabase.co/storage/v1/object/public/avatars/user/best16699913217701672409761952.webp',
      name: 'Nnancy Okoye',
      time: '1 hour ago',
      description: 'Submitted an assignment for lesson Figma prototyping',
      link: '/',
    },
    {
      avatar:
        'https://koxqonvbkeakwvmdegcf.supabase.co/storage/v1/object/public/avatars/user/best16699913217701672409761952.webp',
      name: 'Bro Shagi',
      time: '2 days ago',
      description: 'Submitted an assignment for lesson Figma prototyping',
      link: '/',
    },
    {
      avatar:
        'https://koxqonvbkeakwvmdegcf.supabase.co/storage/v1/object/public/avatars/user/best16699913217701672409761952.webp',
      name: 'Bill Gates',
      time: '13 hours ago',
      description: 'Submitted an assignment for lesson Figma prototyping',
      link: '/',
    },
    {
      avatar:
        'https://koxqonvbkeakwvmdegcf.supabase.co/storage/v1/object/public/avatars/user/best16699913217701672409761952.webp',
      name: 'Steve Jobs',
      time: 'yesterday',
      description: 'Submitted an assignment for lesson Figma prototyping',
      link: '/',
    },
  ];

  $: orgLink = `/org/${orgName}`;
</script>

<svelte:head>
  <title>Dashboard - ClassroomIO</title>
</svelte:head>

<div class="py-10 px-5">
  <div class="flex items-center justify-between mb-10">
    <h1 class="text-3xl font-bold">Dashboard</h1>
    <PrimaryButton label="Create Course" onClick={createCourse} />
  </div>

  <div class="flex items-start flex-wrap">
    {#each boxes as box}
      <div
        class="box flex flex-col rounded border border-gray-200 justify-center px-5 mr-5 mb-5"
      >
        <p class="mb-2 text-sm">{box.label}</p>
        <p class="text-xl font-bold">{box.value}</p>
      </div>
    {/each}
  </div>

  <div class="flex flex-wrap">
    <!-- Your Schedule -->
    <Schedule />

    <!-- Your Activities -->
    <div>
      <div class="flex justify-between">
        <p class="font-bold mb-5">Your Activities</p>
        <a href={orgLink}>View all</a>
      </div>
      <div class="rounded border border-gray-200 w-5 activities-box py-4 px-5">
        {#each activities as activity}
          <div class="flex mb-3 pb-3 border-b border-gray-200">
            <Avatar src={activity.avatar} name="avatar" />
            <div class="ml-2 flex">
              <div class="mr-2">
                <p>{activity.name}</p>
                <p class="mb-2 mt-1">
                  {activity.description}
                </p>
                <a href={activity.link}>View</a>
              </div>

              <div>
                <p>{activity.time}</p>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .box {
    width: 246px;
    height: 165px;
  }
  .activities-box {
    min-width: 450px;
    height: 516px;
    overflow-y: auto;
  }
</style>
