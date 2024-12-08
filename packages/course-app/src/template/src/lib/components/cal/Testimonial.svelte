<script lang="ts">
  import { getPageSection } from '$lib/utils/helpers/page';
  import { homePage } from '$lib/utils/stores/pages';

  const content = $derived(getPageSection($homePage, 'testimonial'));
</script>

{#if content?.show}
  <section id="testimonial" class="bg-[#F4F4F4] px-4 lg:p-14 h-fit">
    <section class="coolumns-1 md:columns-3 space-y-6 overflow-visible">
      {#each content.settings.list as item}
        <div class="break-inside-avoid overflow-visible">
          <section
            class="cursor-pointer flex flex-col relative overflow-visible px-6 pt-6 gap-4 p-4 bg-white border border-[#D7D7D7] rounded-3xl w-full h-fit max-w-full sm:max-w-[320px] xl:max-w-[400px]"
          >
            <div class="flex items-center gap-2">
              <img
                src={item.banner ?? '/classroomio-course-img-template.jpg'}
                alt=""
                class="w-10 h-10 rounded-full"
              />
              <span class="flex flex-col items-start">
                <p class="text-sm font-bold">{item.name}</p>
                <p class="text-sm text-[#4C5A70]">{item.role}</p>
              </span>
            </div>
            <div>
              <p class=" text-[#282828] dark:text-[#ABABAB]">
                {item.description}
              </p>
            </div>
          </section>
        </div>
      {/each}
    </section>
  </section>
{/if}

<style>
  .break-inside-avoid {
    break-inside: avoid;
  }
</style>
