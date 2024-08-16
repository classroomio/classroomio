<script lang="ts">
  import { slide } from 'svelte/transition';
  import PageSignupCTA from '$lib/PageSignupCTA/index.svelte';
  import PageHeader from '$lib/PageHeader/PageHeader.svelte';
  import Forms from '$lib/ContactUs/Forms/Index.svelte';
  import { FORM_TYPE } from '$lib/types';

  let currentForm: keyof typeof FORM_TYPE;

  const formList = [
    {
      id: FORM_TYPE.bug,
      title: '🐜  I want to report a bug'
    },
    {
      id: FORM_TYPE.help,
      title: '🙋‍♂️  I need help'
    },
    {
      id: FORM_TYPE.feature,
      title: '📮  I want to request a feature'
    },
    {
      id: FORM_TYPE.feedback,
      title: '💭  I have feedback'
    }
  ];

  const handleChangeForm = (form: keyof typeof FORM_TYPE) => {
    currentForm = form;
  };
</script>

<svelte:head>
  <title>Contact us | ClassroomIO</title>
</svelte:head>

<section>
  <PageHeader className="flex flex-col items-center justify-center bg-[#F5F8FE] text-center">
    <div class="mb-2 ml-[5%] lg:ml-0 flex w-full items-center justify-start lg:justify-center">
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
    <div class="mx-auto w-[60%] place-items-center grid grid-cols-2 gap-10">
      {#each formList as list}
        <button
          on:click={() => handleChangeForm(list.id)}
          class="text-start border-[1.5px] w-[90%] rounded-md p-3 {currentForm === list.id
            ? `border-[#0233BD]`
            : `border-gray-200`}"
        >
          <p class="text-xl text-slate-700 font-normal">{list.title}</p>
        </button>
      {/each}
    </div>

    {#if currentForm === FORM_TYPE[currentForm]}
      <Forms {currentForm} />
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
