<script>
  import { BarLoader } from 'svelte-loading-spinners';
  import TextField from '../components/Form/TextField.svelte';
  import PrimaryButton from '../components/PrimaryButton/index.svelte';
  import { VARIANTS } from '../components/PrimaryButton/constants';
  import { getSupabase } from '../utils/functions/supabase';

  let email;
  let isAdding = false;
  let success = false;

  const supabase = getSupabase();
  const animate = 'transition delay-75 duration-300 ease-in-out';
  const areas = [
    {
      title: 'Access',
      description:
        'Quickly find any material you need to get your job done. ClassroomIO offers the All-in-on-platform',
    },
    {
      title: 'Analytics',
      description:
        'Avoid assumptions, better understand the needs of your classrooms and give students a personlized experience',
    },
    {
      title: 'Automation',
      description:
        'Lesson reminders, deadline reminders and many other automated alerts to help everyone in the learning process be proactive',
    },
  ];

  async function handleSubmit() {
    isAdding = true;

    await supabase
      .from('waitinglist')
      .insert([{ email }], { returning: 'minimal' });

    success = true;

    setTimeout(() => {
      isAdding = false;
      success = false;
      email = null;
    }, 5000);
  }
</script>

<div
  class="w-screen flex items-center justify-center flex-col m-2 sm:h-screen sm:m-0"
>
  <img
    src="/logo-192.png"
    alt="ClassroomIO logo"
    class="rounded inline-block mx-auto w-20 h-20 sm:w-auto sm:h-auto"
    data-atf="1"
  />

  <div>
    <h3 class="text-4xl text-center">
      Classroom<span class="text-blue-700">IO</span>
    </h3>
    <p class="text-lg text-center">
      The operating system for classroooms of the future.
    </p>
  </div>

  <form on:submit|preventDefault={handleSubmit} class="my-4">
    <div class="flex items-center flex-col sm:flex-row">
      {#if success}
        <p>You have been added successfully. Thanks for joining.</p>
      {:else}
        <TextField
          bind:value={email}
          type="email"
          placeholder="Enter your email.."
          className="mr-3 my-2"
          inputClassName="rounded-md"
          isRequired={true}
          isDisabled={isAdding}
        />
        <PrimaryButton
          type="submit"
          variant={isAdding ? VARIANTS.OUTLINED : VARIANTS.CONTAINED}
          className="py-2 w-full justify-center sm:w-auto {isAdding &&
            'py-4 border-blue-700'}"
          isDisabled={isAdding}
        >
          {#if isAdding}
            <BarLoader size="30" color="#1d4ed8" unit="px" duration="1s" />
          {:else}
            Join waiting list
          {/if}
        </PrimaryButton>
      {/if}
    </div>
  </form>

  <div class="flex flex-col md:flex-row">
    {#each areas as area}
      <div
        class="box m-3 bg-white rounded-md py-4 px-12 active shadow-xl border-2 hover:border-blue-700 {animate}"
      >
        <h3 class="text-3xl">{area.title}</h3>
        <p>{area.description}</p>
      </div>
    {/each}
  </div>
</div>

<style>
  .box {
    max-width: 350px;
  }
</style>
