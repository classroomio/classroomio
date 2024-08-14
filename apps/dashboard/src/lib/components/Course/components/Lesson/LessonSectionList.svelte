<script lang="ts">
  import { Edit, TrashCan, Add } from 'carbon-icons-svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { t } from '$lib/utils/functions/translations';
  import { handleAddLessonWidget } from '$lib/components/Course/components/Lesson/store';
  import { snackbar } from '$lib/components/Snackbar/store';
  import {
    lessonSections,
    handleDelete,
    handleSaveLesson,
    handleSaveLessonSection,
    handleDeleteSection
  } from '$lib/components/Course/components/Lesson/store/lessons';
  import type { Lesson } from '$lib/utils/types';
  import DeleteLessonConfirmation from '$lib/components/Course/components/Lesson/DeleteLessonConfirmation.svelte';
  import RoleBasedSecurity from '$lib/components/RoleBasedSecurity/index.svelte';

  type CrudParam = {
    sectionId?: string;
    lessonId?: string;
    sectionTitle?: string;
    lessonTitle?: string;
  };

  // export let reorder = false;
  export let lessonEditing: string | undefined;

  let prevTitle: string | undefined;
  let errors: Record<string, string>;
  let openDeleteModal = false;
  let deletingData = {
    id: '',
    isSection: false
  };

  function onEdit(params: CrudParam) {
    lessonEditing = params.sectionId || params.lessonId;
    prevTitle = params.sectionTitle || params.lessonTitle;
  }

  async function onSave(params: CrudParam, lesson?: Lesson) {
    if (params.sectionId) {
      const section = $lessonSections.find((s) => s.id === params.sectionId);
      if (!section) return;

      const validationRes = await handleSaveLessonSection(section, section.course_id);

      if (validationRes && Object.keys(validationRes).length) {
        errors = {
          // @ts-ignore
          title: validationRes?.title
        };
      }
    } else if (lesson) {
      const validationRes = await handleSaveLesson(lesson, lesson.course_id);

      if (validationRes && Object.keys(validationRes).length) {
        errors = {
          // @ts-ignore
          title: validationRes?.title
        };
      }
    }

    if (!errors?.title) {
      resetEdit();
    } else {
      snackbar.success('snackbar.success_update');
    }
  }

  function onDelete(params: CrudParam) {
    deletingData.id = params.sectionId || params.lessonId || '';
    deletingData.isSection = params.sectionId ? true : false;
    openDeleteModal = true;
  }

  function deleteLesson() {
    if (deletingData.isSection) {
      handleDeleteSection(deletingData.id);
    } else {
      handleDelete(deletingData.id);
    }
  }

  function resetEdit() {
    lessonEditing = undefined;
    prevTitle = undefined;
    errors = {};
  }

  function handleAddLesson(id) {
    handleAddLessonWidget.update(() => ({
      open: true,
      isSection: false,
      id
    }));
  }
</script>

<DeleteLessonConfirmation bind:openDeleteModal {deleteLesson} />

<section class="w-full p-3 lg:w-11/12 lg:px-4">
  <div class="max-w-xl mx-auto">
    {#each $lessonSections as section (section.id)}
      <div class="mb-3 border border-gray-200 rounded-md">
        <div
          class="mb-2 px-3 py-1 border-b bg-gray-50 rounded-tl-md rounded-tr-md flex justify-between items-center"
        >
          {#if lessonEditing === section.id}
            <TextField className="w-4/6" bind:value={section.title} errorMessage={errors?.title} />
          {:else}
            <p class="w-4/6 font-semibold">{section.title}</p>
          {/if}

          <RoleBasedSecurity allowedRoles={[1, 2]}>
            <div class="flex items-center">
              {#if lessonEditing === section.id}
                <PrimaryButton
                  label={$t('course.navItem.lessons.add_lesson.cancel')}
                  variant={VARIANTS.OUTLINED}
                  onClick={() => {
                    section.title = prevTitle ?? section.title;
                    resetEdit();
                  }}
                />
                <PrimaryButton
                  label={$t('course.navItem.lessons.add_lesson.save')}
                  onClick={() => onSave({ sectionId: section.id })}
                />
              {:else}
                <IconButton onClick={() => handleAddLesson(section.id)} disabled={!!lessonEditing}>
                  <Add size={20} />
                </IconButton>
                <IconButton
                  onClick={() => onEdit({ sectionId: section.id, sectionTitle: section.title })}
                  disabled={!!lessonEditing}
                >
                  <Edit size={20} />
                </IconButton>
                <IconButton
                  onClick={() => onDelete({ sectionId: section.id })}
                  disabled={!!lessonEditing}
                >
                  <TrashCan size={20} />
                </IconButton>
              {/if}
            </div>
          </RoleBasedSecurity>
        </div>

        <div class="mx-3 py-1">
          {#each section.lessons as lesson (lesson.id)}
            <div
              class="border max-w-xl border-gray-200 px-3 py-1 min-h-[50px] rounded-md mb-2 flex items-center justify-between"
            >
              {#if lessonEditing === lesson.id}
                <TextField
                  className="w-4/6"
                  bind:value={lesson.title}
                  errorMessage={errors?.title}
                />
              {:else}
                <p class="w-4/6 text-md">{lesson.title}</p>
              {/if}

              <RoleBasedSecurity allowedRoles={[1, 2]}>
                <div class="flex items-center gap-1">
                  {#if lessonEditing === lesson.id}
                    <PrimaryButton
                      label={$t('course.navItem.lessons.add_lesson.cancel')}
                      variant={VARIANTS.OUTLINED}
                      onClick={() => {
                        lesson.title = prevTitle ?? lesson.title;
                        resetEdit();
                      }}
                    />
                    <PrimaryButton
                      label={$t('course.navItem.lessons.add_lesson.save')}
                      onClick={() => onSave({ lessonId: lesson.id }, lesson)}
                    />
                  {:else}
                    <IconButton
                      onClick={() => onEdit({ lessonId: lesson.id, lessonTitle: lesson.title })}
                      disabled={!!lessonEditing}
                    >
                      <Edit size={20} />
                    </IconButton>
                    <IconButton
                      onClick={() => onDelete({ lessonId: lesson.id })}
                      disabled={!!lessonEditing}
                    >
                      <TrashCan size={20} />
                    </IconButton>
                  {/if}
                </div>
              </RoleBasedSecurity>
            </div>
          {:else}
            {$t('course.navItem.lessons.no_lesson')}
          {/each}
        </div>
      </div>
    {/each}
  </div>
</section>
