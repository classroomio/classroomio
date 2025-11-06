<script>
  import { onMount } from 'svelte';
  import BotIcon from '@lucide/svelte/icons/bot';
  import DoorOpenIcon from '@lucide/svelte/icons/door-open';
  import ChartAreaIcon from '@lucide/svelte/icons/chart-area';

  import { getSupabase } from '$lib/utils/functions/supabase';
  import { preventDefault } from '$lib/utils/functions/svelte';
  import { validateEmail } from '$lib/utils/functions/validateEmail';

  import TextField from '$lib/components/Form/TextField.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';

  let email = $state('');
  let isAdding = $state(false);
  let success = $state(false);

  const supabase = getSupabase();
  const animate = 'transition delay-75 duration-300 ease-in-out';
  const areas = [
    {
      title: 'Access',
      description: 'Quickly find any material you need to get your job done. ClassroomIO offers the All-in-on-platform'
    },
    {
      title: 'Analytics',
      description:
        'Avoid assumptions, better understand the needs of your classrooms and give students a personlized experience'
    },
    {
      title: 'Automation',
      description:
        'Lesson reminders, deadline reminders and many other automated alerts to help everyone in the learning process be proactive'
    }
  ];

  async function handleSubmit() {
    if (!email || !validateEmail(email)) return;
    isAdding = true;

    await supabase.from('waitinglist').insert([{ email }]);

    success = true;

    setTimeout(() => {
      isAdding = false;
      success = false;
      email = '';
    }, 5000);
  }

  onMount(() => {
    console.log('Welcome to CIO');
  });
</script>

<svelte:head>
  <title>ClassroomIO - The classroom software</title>
</svelte:head>

<div class="m-2 flex w-screen flex-col items-center justify-center sm:m-0 md:min-h-[93vh] dark:bg-black">
  <!--
    <img
      src="/logo-192.png"
      alt="ClassroomIO logo"
      class="rounded inline-block mx-auto w-20 h-20 sm:w-auto sm:h-auto"
      data-atf="1"
    />
  -->
  <div>
    <h3 class="text-center text-4xl dark:text-white">
      Classroom<span class="text-primary-700">IO</span>
    </h3>
    <p class="text-center text-lg dark:text-white">The operating system for classroooms of the future 🚀🚀🚀.</p>
  </div>

  <form onsubmit={preventDefault(handleSubmit)} class="my-4 hidden">
    <div class="flex hidden flex-col items-center sm:flex-row">
      {#if success}
        <p class="dark:text-white">You have been added successfully. Thanks for joining.</p>
      {:else}
        <TextField
          bind:value={email}
          type="email"
          placeholder="Enter your email.."
          className="mr-3 my-2"
          isRequired={true}
          isDisabled={isAdding}
        />
        <PrimaryButton type="submit" isLoading={isAdding}>Join waiting list</PrimaryButton>
      {/if}
    </div>
  </form>

  <div class="mt-4 flex md:flex-row">
    {#each areas as area, index}
      <div
        class="active hover:border-primary-700 m-3 max-w-[350px] rounded-md border-2 bg-white px-12 py-3 shadow-xl dark:bg-black {animate}"
      >
        <h3 class="text-3xl dark:text-white">
          {#if index === 0}
            <DoorOpenIcon size={30} />
          {:else if index === 1}
            <ChartAreaIcon size={30} />
          {:else if index === 2}
            <BotIcon size={30} />
          {/if}
          {area.title}
        </h3>
        <p class="dark:text-white">{area.description}</p>
      </div>
    {/each}
  </div>
</div>
