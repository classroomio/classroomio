<script lang="ts">
  import { onMount } from 'svelte';

  import { t } from '$lib/utils/functions/translations';
  import { addCourseTag, fetchCourseTags } from '$lib/utils/services/courses';
  import { currentOrg } from '$lib/utils/store/org';
  import type { CourseTag } from '$lib/utils/types';
  import { course } from '../Course/store';
  import { addTagModal, createTagModal, tags } from './store';

  import TextField from '$lib/components/Form/TextField.svelte';
  import Modal from '$lib/components/Modal/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '../PrimaryButton/constants';
  import { snackbar } from '../Snackbar/store';
  import TagButton from './TagButton.svelte';

  // NOTE:
  // tag_id - is the id of the tag (from the tags table)
  // course_tag_id - is the id of the tag in the course_tags table

  let searchValue = '';
  let filteredTags: CourseTag[] = []; // array containing the filtered tags (the tags in the tag store but not in the course)
  let courseTag: CourseTag[] = []; // array containing all the tags in the course

  function resetStore() {
    $addTagModal.open = false;
  }

  async function handleAddTag(tag: CourseTag) {
    try {
      const response = await addCourseTag($course.id, tag.id);

      if (response.data && response.data.length > 0) {
        const addedTagId = response.data[0].tag_id;
        let addedTag = $tags.find((t) => t.id === addedTagId);

        if (addedTag) {
          addedTag.course_tag_id = response.data[0].id;
          addedTag.id = response.data[0].tag_id;

          $course.tags = [...$course.tags, addedTag];
          courseTag = $course.tags;

          filteredTags = $tags.filter((t) => !courseTag.some((ct) => ct.id === t.id));
        }
      }
    } catch (error) {
      snackbar.error('tags.errors.add_tag');
      console.error('Error adding tag:', error);
    }
  }

  async function fetchTags(orgId: string) {
    try {
      // fetch all tags in this organization and keep in the store
      const response = await fetchCourseTags(orgId);
      tags.set(response as CourseTag[]);

      // initialize courseTag with the current course's tags
      courseTag = $course.tags;

      // update the filteredTags array to be the tags that are in $tags BUT NOT in courseTag
      filteredTags = $tags?.filter((t) => !courseTag.some((ct) => ct.id === t.id));
    } catch (error) {
      snackbar.error('tags.errors.fetch_tags');
      console.error('Error fetching tags:', error);
    }
  }

  onMount(() => {
    fetchTags($currentOrg.id);
  });

  $: filteredTags = $tags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(searchValue.toLowerCase()) &&
      !courseTag.some((ct) => ct.id === tag.id)
  );
</script>

<Modal
  onClose={() => resetStore()}
  bind:open={$addTagModal.open}
  width="md:w-2/5 w-[80%]"
  modalHeading={$t('tags.add_tag_modal.heading')}
>
  <div class="-mt-5">
    <TextField
      label=""
      className="w-full mb-2"
      labelClassName="text-xs mb-2 font-normal"
      inputClassName="text-sm"
      placeholder={$t('tags.add_tag_modal.placeholder')}
      bind:value={searchValue}
    />

    <!-- all tags -->
    <div class="my-2 flex flex-wrap items-center gap-3">
      <p class="text-xs">{$t('tags.add_tag_modal.header')}:</p>
      <div
        class="flex w-full max-w-[80%] items-center gap-3 overflow-x-auto py-6"
        style="overflow-x: auto; white-space: nowrap;"
      >
        {#if filteredTags.length > 0}
          {#each filteredTags as tag}
            <TagButton isAdd={true} {tag} handleTag={handleAddTag} />
          {/each}
        {/if}
      </div>
    </div>

    <PrimaryButton
      width="w-[30%]"
      className="py-3 mt-5 rounded-md text-sm font-medium"
      label="Create new tag"
      onClick={() => {
        $createTagModal.open = true;
        $addTagModal.open = false;
      }}
      variant={VARIANTS.CONTAINED}
    />
  </div>
</Modal>
