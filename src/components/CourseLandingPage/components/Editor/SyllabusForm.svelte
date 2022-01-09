<script>
  import TextField from '../../../Form/TextField.svelte';
  import PrimaryButton from '../../../PrimaryButton/index.svelte';
  import CloseButton from '../../../Buttons/Close/index.svelte';
  import { VARIANTS } from '../../../PrimaryButton/constants';
  import { landingPageStore } from '../../store';

  function handleAdd() {
    landingPageStore.update((store) => {
      const { syllabus } = store;

      const lessons = [
        ...syllabus.lessons,
        {
          title: '',
        },
      ];

      return {
        ...store,
        syllabus: {
          lessons,
        },
      };
    });
  }

  function handleDelete(index) {
    landingPageStore.update((store) => {
      const { syllabus } = store;

      return {
        ...store,
        syllabus: {
          lessons: syllabus.lessons.filter(
            (lesson, lessonIndex) => index !== lessonIndex
          ),
        },
      };
    });
  }
</script>

<h4 class="mb-3">Lessons</h4>

{#each $landingPageStore.syllabus.lessons as lesson, index}
  <div class="mb-4 relative">
    <TextField bind:value={lesson.title} />
    <div class="absolute -top-3 -right-3">
      <CloseButton
        onClick={() => handleDelete(index)}
        contained={true}
        size="small"
      />
    </div>
  </div>
{/each}

<div class="mt-3">
  <PrimaryButton label="Add" onClick={handleAdd} variant={VARIANTS.OUTLINED} />
</div>
