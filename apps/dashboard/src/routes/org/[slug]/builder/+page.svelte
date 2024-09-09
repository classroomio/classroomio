<script>
  import { t } from '$lib/utils/functions/translations';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';

  const templates = [
    {
      id: 1,
      title: 'Exam Prep',
      image: '/exam-prep'
    },
    {
      id: 2,
      title: 'Bootcamps',
      image: '/bootcamp'
    },
    {
      id: 3,
      title: 'Expert/Individual',
      image: '/individual'
    },
    {
      id: 4,
      title: 'Academy/Organization',
      image: '/organization'
    }
  ];

  let currentTemplate = templates[0];

  const selectTemplate = (template) => {
    currentTemplate = template;
  };
</script>

<svelte:head>
  <title>Site Builder - ClassroomIO</title>
</svelte:head>

<section class="py-2 px-10 w-full max-w-5xl md:mx-auto">
  <header class="flex flex-col md:flex-row justify-between md:items-center">
    <h1 class="text-xl">{$t('template_builder.title')}</h1>
    <PrimaryButton variant={VARIANTS.OUTLINED}>{$t('template_builder.view')}</PrimaryButton>
  </header>

  <section class="mt-8">
    <!-- current image -->
    <div class="border rounded-md">
      <div
        class="bg-[#f1f6ff] px-5 md:px-10 pt-5 md:pt-8 rounded-tl-md rounded-tr-md max-h-[50vh] overflow-hidden overflow-y-auto"
      >
        <img
          class="w-full"
          src="/images/builder-templates/{currentTemplate.image}-template.png"
          alt="{currentTemplate.title} Template"
        />
      </div>

      <div class="px-10 py-4 flex gap-y-5 flex-col md:flex-row justify-between md:items-center">
        <div>
          <p class="text-base font-semibold">{currentTemplate.title}</p>
          <p class="text-xs mt-1">{$t('template_builder.added')} 5 {$t('template_builder.days')}</p>
        </div>
        <PrimaryButton className="w-full md:w-fit" variant={VARIANTS.CONTAINED_DARK}
          >{$t('template_builder.customize')}</PrimaryButton
        >
      </div>
    </div>

    <div class="my-10">
      <h1 class="font-bold text-lg">{$t('template_builder.more')}</h1>

      <div class="flex flex-wrap gap-y-5 justify-between">
        <!-- templates -->
        {#each templates as template}
          <div class="border rounded-md w-full md:max-w-[31%]">
            <div
              class="relative bg-[#f1f6ff] px-5 pt-4 rounded-tl-md rounded-tr-md h-full max-h-[40vh] md:max-h-[27vh] overflow-hidden"
            >
              <img
                class="md:hover:scale-105 duration-300 transition-all"
                src="/images/builder-templates/{template.image}-template.png"
                alt="{template.title} Template"
              />

              <!-- overlay -->
              <div
                class="overlay hidden absolute inset-0 bg-black bg-opacity-50 justify-center items-center"
              >
                <button
                  type="button"
                  on:click={() => selectTemplate(template)}
                  class="text-black font-semibold text-sm py-2 px-4 bg-white rounded"
                >
                  {#if currentTemplate.id === template.id}
                    Added
                  {:else}
                    {$t('template_builder.preview')}
                  {/if}
                </button>
              </div>
            </div>

            <div class="px-5 py-3 flex justify-between items-center">
              <p class="text-sm font-semibold">{template.title}</p>
              <button
                type="button"
                disabled={currentTemplate.id === template.id}
                class="text-xs font-medium px-2.5 py-1 border border-[#282828] rounded-sm"
                on:click={() => selectTemplate(template)}
              >
                {#if currentTemplate.id === template.id}
                  Added
                {:else}
                  {$t('template_builder.add')}
                {/if}</button
              >
            </div>
          </div>
        {/each}
      </div>
    </div>
  </section>
</section>

<style>
  .relative:hover .overlay {
    display: flex;
  }
</style>
