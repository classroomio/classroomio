<script lang="ts">
  import {
    OverflowMenu,
    OverflowMenuItem,
    Search,
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListHead,
    StructuredListRow
  } from 'carbon-components-svelte';
  import ArrowRight from 'carbon-icons-svelte/lib/ArrowRight.svelte';
  import OverflowMenuHorizontal from 'carbon-icons-svelte/lib/OverflowMenuHorizontal.svelte';

  import Box from '$lib/components/Box/index.svelte';
  import { createTagModal, selectedTag, tags } from '$lib/components/CourseTags/store';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { t } from '$lib/utils/functions/translations';
  import { fetchCourseTags } from '$lib/utils/services/courses';
  import { currentOrg } from '$lib/utils/store/org';
  import type { CourseTag } from '$lib/utils/types';

  import CreateTagModal from '$lib/components/CourseTags/CreateTagModal.svelte';
  import TagsEmptyIcon from '$lib/components/Icons/TagsEmptyIcon.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';

  let searchValue = '';
  let filteredTags: CourseTag[] = [];

  function handleEditClick(tag: CourseTag) {
    $selectedTag = tag;
    $createTagModal.editMode = true;
    $createTagModal.open = true;
  }

  function handleDeleteClick(tag: CourseTag) {
    $selectedTag = tag;
    $createTagModal.deleteMode = true;
    $createTagModal.open = true;
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

<CreateTagModal />

<svelte:head>
  <title>Tags - ClassroomIO</title>
</svelte:head>

<section class="mx-auto w-full max-w-5xl">
  <div class="flex flex-wrap items-center justify-between py-10">
    <h1 class="m-0 text-2xl font-bold md:text-3xl dark:text-white">{$t('tags.tags')}</h1>

    <!-- button for mobile screen (better ui) -->
    <PrimaryButton
      width="md:w-[60%] w-fit"
      type="button"
      label={$t('tags.create_new_tags')}
      className="border-blue-600 border px-10 block md:hidden"
      variant={VARIANTS.CONTAINED}
      onClick={() => ($createTagModal.open = true)}
    />

    <div class="flex w-full flex-wrap items-center justify-between py-3 md:w-fit md:flex-nowrap">
      <Search
        placeholder={$t('tags.find_tag')}
        bind:value={searchValue}
        searchClass="mr-2"
        class="bg-gray-100 dark:bg-neutral-800"
      />

      <div class="w-[70%]">
        <PrimaryButton
          width="w-full"
          type="button"
          label={$t('tags.create_new_tags')}
          className="border-blue-600 border hidden md:block"
          variant={VARIANTS.CONTAINED}
          onClick={() => ($createTagModal.open = true)}
        />
      </div>
    </div>
  </div>

  <section>
    {#if filteredTags && filteredTags.length > 0}
      <StructuredList>
        <StructuredListHead class="dark:border-2 dark:border-neutral-800">
          <StructuredListRow head>
            <StructuredListCell head class="bg-[#F1F6FF] py-5 pl-10 dark:bg-black dark:text-white"
              >{$t('tags.tags')}</StructuredListCell
            >
            <StructuredListCell head class="bg-[#F1F6FF] py-5 dark:bg-black dark:text-white"
              >{$t('tags.description')}</StructuredListCell
            >
            <StructuredListCell head class="bg-[#F1F6FF] py-5 dark:bg-black dark:text-white"
              >{$t('tags.course_count')}</StructuredListCell
            >
            <StructuredListCell head class="bg-[#F1F6FF] py-5 dark:bg-black dark:text-white"
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
                  class="flex w-fit items-center gap-2 rounded-sm bg-[#D9E0F5] px-2 py-0.5 text-xs font-semibold dark:border dark:bg-black"
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
      <Box className="w-full">
        <TagsEmptyIcon />

        <h1>{$t('tags.no_tags_yet')}</h1>
        <p class="m-0 text-center text-sm">
          {$t('tags.add_a_group')}
        </p>

        <PrimaryButton
          label={$t('tags.add_tags')}
          type="button"
          className="border-blue-600 border w-full mt-2"
          variant={VARIANTS.OUTLINED}
          onClick={() => ($createTagModal.open = true)}
        />
      </Box>
    {/if}
  </section>
</section>
