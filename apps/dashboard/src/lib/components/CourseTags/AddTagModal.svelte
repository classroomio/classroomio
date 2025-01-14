<script lang="ts">
  import { onMount } from 'svelte';

  import { t } from '$lib/utils/functions/translations';
  import { addCourseTag, fetchCourseTags, removeCourseTag } from '$lib/utils/services/courses';
  import { currentOrg } from '$lib/utils/store/org';
  import type { CourseTag } from '$lib/utils/types';
  import { course } from '../Course/store';
  import { addTagModal, tags } from './store';

  import TextField from '$lib/components/Form/TextField.svelte';
  import Modal from '$lib/components/Modal/index.svelte';
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
    const response = await addCourseTag($course.id, tag.id);

    if (response.data && response.data.length > 0) {
      // use the id of the response.data[0].tag_id to look for the object with that id in tag store
      const addedTagId = response.data[0].tag_id;
      let addedTag = $tags.find((t) => t.id === addedTagId);

      if (addedTag) {
        addedTag.course_tag_id = response.data[0].id;
        addedTag.id = response.data[0].tag_id;

        // upadate store & local variable
        $course.tags = [...$course.tags, addedTag];
        courseTag = $course.tags;

        // filter like as mentioned in line 20
        filteredTags = $tags.filter((t) => !courseTag.some((ct) => ct.id === t.id));
      }
    }
  }

  async function handleRemoveTag(tag: CourseTag) {
    const response = await removeCourseTag(tag.course_tag_id);

    if (response.data && response.data.length > 0) {
      $course.tags = $course.tags.filter((ct) => ct.id !== tag.id);

      courseTag = $course.tags;

      filteredTags = $tags.filter((t) => !courseTag.some((ct) => ct.id === t.id));
    }
  }

  async function fetchTags(orgId: string) {
    // fetch all tags in this organization and keep in the store
    const response = await fetchCourseTags(orgId);
    tags.set(response as CourseTag[]);

    // initialize courseTag with the current course's tags
    courseTag = $course.tags;

    // update the filteredTags array to be the tags that are in $tags BUT NOT in courseTag
    filteredTags = $tags?.filter((t) => !courseTag.some((ct) => ct.id === t.id));
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

    <div class="mb-2 flex flex-wrap items-center gap-3 border-b pb-3">
      <p class="text-xs">{$t('tags.add_tag_modal.header')}:</p>
      <div class="flex max-h-[10vh] flex-wrap items-center gap-3 overflow-hidden overflow-y-auto">
        {#if courseTag.length > 0}
          {#each courseTag as tag}
            <TagButton isRemove={true} {tag} handleTag={handleRemoveTag} />
          {/each}
        {/if}
      </div>
    </div>

    <div class="flex flex-wrap gap-3">
      {#if filteredTags.length > 0}
        {#each filteredTags as tag}
          <TagButton isAdd={true} {tag} handleTag={handleAddTag} />
        {/each}
      {/if}
    </div>
  </div>
</Modal>
