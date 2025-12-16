<script lang="ts">
  import { ArrowUpRight } from '@lucide/svelte';

  import { FORM_TYPE } from '$lib/types';
  import type { FORM_TYPE_KEY } from '$lib/types';

  import HelpForm from '$lib/Contact/HelpForm.svelte';
  import PageHeader from '$lib/PageHeader/PageHeader.svelte';
  import FeedbackForm from '$lib/Contact/FeedbackForm.svelte';

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
    <div class="mb-2 ml-[5%] flex w-full items-center justify-center lg:ml-0">
      <span
        style="color: rgb(75, 85, 99);"
        class="rounded-full border-2 border-[#C2D2FF] bg-[#DCE5FF] px-4 py-1 text-sm font-medium text-blue-700"
      >
        Contact Us
      </span>
    </div>
    <h1 class="mx-auto flex flex-col items-center text-4xl font-bold text-slate-900 md:text-7xl lg:text-6xl">
      <span>Get in touch with <span class="text-blue-700">Us</span></span>
    </h1>
    <p class="mt-10 w-[90%] max-w-3xl text-center text-lg font-normal text-slate-700 md:w-[60%] lg:mt-7">
      Report any bugs you encounter, request new features you'd like to see, or ask any questions you have about
      ClassroomIO
    </p>
  </PageHeader>

  <div class="mx-auto my-20">
    <!-- Content here -->
    <div class="mx-auto grid w-[90%] grid-cols-1 place-items-center gap-10 md:grid-cols-2 lg:w-[60%]">
      {#each formList as list}
        <button
          on:click={() => onChange(list.id, list.to)}
          class="w-full rounded-md border-[1.5px] p-3 text-start {currentForm === list.id
            ? `border-[#0233BD]`
            : `border-gray-200`} flex items-center justify-between"
        >
          <p class="text-lg font-normal text-slate-700">{list.title}</p>
          {#if list.to}
            <ArrowUpRight size={16} />
          {/if}
        </button>
      {/each}
    </div>

    {#if currentForm === FORM_TYPE[currentForm]}
      <div class="mx-auto w-[90%] px-5 lg:w-[60%]">
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
