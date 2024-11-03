<script lang="ts">
  import {
    StructuredList,
    StructuredListHead,
    StructuredListRow,
    StructuredListCell,
    StructuredListBody
  } from 'carbon-components-svelte';
  import { Search } from 'carbon-components-svelte';
  import ArrowRight from 'carbon-icons-svelte/lib/ArrowRight.svelte';
  import { OverflowMenu, OverflowMenuItem } from 'carbon-components-svelte';
  import OverflowMenuHorizontal from 'carbon-icons-svelte/lib/OverflowMenuHorizontal.svelte';

  import type { CourseTag } from '$lib/utils/types';
  import { currentOrg } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { fetchCourseTags } from '$lib/utils/services/courses';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { tagModal, tags, selectedTag } from '$lib/components/CourseTags/store';

  import TagModal from '$lib/components/CourseTags/TagModal.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import TagsEmptyIcon from '$lib/components/Icons/TagsEmptyIcon.svelte';

  let searchValue = '';
  let filteredTags: CourseTag[] = [];

  function handleEditClick(tag: CourseTag) {
    $selectedTag = tag;
    $tagModal.editMode = true;
    $tagModal.open = true;
  }

  function handleDeleteClick(tag: CourseTag) {
    $selectedTag = tag;
    $tagModal.deleteMode = true;
    $tagModal.open = true;
  }

  async function fetchTags(orgId: string) {
    const response = await fetchCourseTags(orgId);
    $tags = response as CourseTag[];
    filteredTags = $tags;
  }

  $: fetchTags($currentOrg.id);
  $: filteredTags = $tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchValue.toLowerCase())
  );
</script>

<TagModal />

<svelte:head>
  <title>Tags - ClassroomIO</title>
</svelte:head>

<section class="w-full h-full max-w-[95%] mx-auto">
  <div class="flex flex-wrap justify-between items-center mb-7 md:mt-0 mt-5">
    <h1 class="m-0">{$t('tags.tags')}</h1>

    <!-- button for mobile screen (better ui) -->
    <PrimaryButton
      width="md:w-[60%] w-fit"
      type="button"
      label={$t('tags.create_new_tags')}
      className="border-blue-600 border px-10 block md:hidden"
      variant={VARIANTS.CONTAINED}
      onClick={() => ($tagModal.open = true)}
    />

    <div class="flex flex-wrap md:flex-nowrap gap-3 py-3 w-full md:w-fit mt-3 md:mt-0">
      <Search
        placeholder={$t('tags.find_tag')}
        bind:value={searchValue}
        searchClass="mr-2"
        class="bg-gray-100 dark:bg-neutral-800"
      />

      <PrimaryButton
        width="w-[60%]"
        type="button"
        label={$t('tags.create_new_tags')}
        className="border-blue-600 border px-10 hidden md:block"
        variant={VARIANTS.CONTAINED}
        onClick={() => ($tagModal.open = true)}
      />
    </div>
  </div>

  <section>
    {#if filteredTags && filteredTags.length > 0}
      <StructuredList>
        <StructuredListHead class="dark:border-2 dark:border-neutral-800">
          <StructuredListRow head>
            <StructuredListCell head class="bg-[#F1F6FF] dark:bg-black py-5 pl-10 dark:text-white"
              >{$t('tags.tags')}</StructuredListCell
            >
            <StructuredListCell head class="bg-[#F1F6FF] dark:bg-black py-5 dark:text-white"
              >{$t('tags.description')}</StructuredListCell
            >
            <StructuredListCell head class="bg-[#F1F6FF] dark:bg-black py-5 dark:text-white"
              >{$t('tags.course_count')}</StructuredListCell
            >
            <StructuredListCell head class="bg-[#F1F6FF] dark:bg-black py-5 dark:text-white"
              >{$t('tags.action')}</StructuredListCell
            >
          </StructuredListRow>
        </StructuredListHead>

        <StructuredListBody>
          {#each filteredTags as tag}
            <StructuredListRow class="relative">
              <StructuredListCell class="w-1/4 px-3">
                {tag.name}
              </StructuredListCell>
              <StructuredListCell class="w-1/3 px-3">
                {tag.description}
              </StructuredListCell>
              <StructuredListCell class="w-1/4 px-3">
                <div
                  class="flex gap-2 items-center font-semibold bg-[#D9E0F5] dark:bg-black dark:border rounded-sm px-2 py-0.5 w-fit text-xs"
                >
                  <!-- the fallback here for course count is for cases where the a new tag gets created and you know the courseCount can't be calculated yet but it will be 0 still -->
                  {tag.courseCount ? tag.courseCount : 0}
                  {tag.courseCount && tag.courseCount > 1 ? $t('tags.courses') : $t('tags.course')}
                  <ArrowRight />
                </div>
              </StructuredListCell>
              <StructuredListCell class="w-1/2">
                <OverflowMenu>
                  <div slot="menu" class="px-4"><OverflowMenuHorizontal /></div>
                  <OverflowMenuItem
                    text={$t('tags.edit_tag')}
                    on:click={() => handleEditClick(tag)}
                  />
                  <OverflowMenuItem
                    danger
                    text={$t('tags.delete')}
                    on:click={() => handleDeleteClick(tag)}
                  />
                </OverflowMenu>
              </StructuredListCell>
            </StructuredListRow>
          {/each}
        </StructuredListBody>
      </StructuredList>
    {:else}
      <!-- if there are no tags available -->
      <div class="h-full flex justify-center items-center">
        <div class="w-[40%] mx-auto h-full flex flex-col items-center justify-center">
          <TagsEmptyIcon />
          <h1>{$t('tags.no_tags_yet')}</h1>
          <p class="m-0 text-sm text-center">
            {$t('tags.add_a_group')}
          </p>

          <PrimaryButton
            label={$t('tags.add_tags')}
            type="button"
            className="border-blue-600 border w-full mt-2"
            variant={VARIANTS.OUTLINED}
          />
        </div>
      </div>
    {/if}
  </section>
</section>
