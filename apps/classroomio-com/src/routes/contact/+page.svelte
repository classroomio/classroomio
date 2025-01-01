<script lang="ts">
  import ArrowUpRight from 'carbon-icons-svelte/lib/ArrowUpRight.svelte';
  import PageHeader from '$lib/PageHeader/PageHeader.svelte';

  import FeedbackForm from '$lib/Contact/FeedbackForm.svelte';
  import HelpForm from '$lib/Contact/HelpForm.svelte';
  import { FORM_TYPE } from '$lib/types';
  import type { FORM_TYPE_KEY } from '$lib/types';

  let currentForm: FORM_TYPE_KEY;

  const formList = [
    {
      id: FORM_TYPE.BUG,
      title: '🐜  I want to report a bug',
      to: 'https://github.com/classroomio/classroomio/issues/new?assignees=&labels=bug&projects=&template=bug-report.yml'
    },
    {
      id: FORM_TYPE.HELP,
      title: '🙋‍♂️  I need help'
    },
    {
      id: FORM_TYPE.FEATURE,
      title: '📮  I want to request a feature',
      to: 'https://github.com/classroomio/classroomio/issues/new?assignees=&labels=&projects=&template=feature-request.yml'
    },
    {
      id: FORM_TYPE.FEEDBACK,
      title: '💭  I have feedback'
    }
  ];

  const onChange = (form: FORM_TYPE_KEY, to?: string) => {
    currentForm = form;

    if (to) {
      window.open(to, '_blank');
    }
  };
</script>

<svelte:head>
  <title>Contact us | ClassroomIO</title>
</svelte:head>

<section>
  <PageHeader className="flex flex-col items-center justify-center bg-[#F5F8FE] text-center">
    <div class="mb-2 ml-[5%] lg:ml-0 flex w-full items-center justify-center">
      <span
        style="color: rgb(75, 85, 99);"
        class="rounded-full border-2 border-[#C2D2FF] px-4 py-1 text-sm font-medium bg-[#DCE5FF] text-blue-700"
      >
        Contact Us
      </span>
    </div>
    <h1
      class="mx-auto text-4xl md:text-7xl lg:text-6xl font-bold text-slate-900 flex flex-col items-center"
    >
      <span>Get in touch with <span class="text-blue-700">Us</span></span>
    </h1>
    <p
      class="w-[90%] md:w-[60%] max-w-3xl text-center font-normal text-lg text-slate-700 mt-10 lg:mt-7"
    >
      Report any bugs you encounter, request new features you'd like to see, or ask any questions
      you have about ClassroomIO
    </p>
  </PageHeader>

  <div class="my-20 mx-auto">
    <!-- Content here -->
    <div
      class="mx-auto w-[90%] lg:w-[60%] place-items-center grid grid-cols-1 md:grid-cols-2 gap-10"
    >
      {#each formList as list}
        <button
          on:click={() => onChange(list.id, list.to)}
          class="text-start border-[1.5px] w-full rounded-md p-3 {currentForm === list.id
            ? `border-[#0233BD]`
            : `border-gray-200`} flex items-center justify-between"
        >
          <p class="text-lg text-slate-700 font-normal">{list.title}</p>
          {#if list.to}
            <ArrowUpRight size={16} />
          {/if}
        </button>
      {/each}
    </div>

    {#if currentForm === FORM_TYPE[currentForm]}
      <div class="mx-auto w-[90%] lg:w-[60%] px-5">
        {#if currentForm === FORM_TYPE.HELP}
          <HelpForm />
        {:else if currentForm === FORM_TYPE.FEEDBACK}
          <FeedbackForm />
        {/if}
      </div>
    {/if}
    <!-- <PageSignupCTA
      header="Scale your Teaching Business in Minutes"
      subText="Don't wait, let's get you started."
      btnLabel="Register"
      link="/teach/register"
      demo={false}
    /> -->
  </div>
</section>
