<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import type { LearningPathInstructorItem } from '@cio/ui/custom/org-landing-page';

  interface Props {
    instructors: LearningPathInstructorItem[];
  }

  let { instructors }: Props = $props();
</script>

{#if instructors.length > 0}
  <section class="mx-auto w-full max-w-4xl px-4 py-12 md:px-6">
    <h2 class="ui:text-foreground mb-6 text-2xl font-semibold">
      {t.get('public_learning_paths.detail.instructors_heading')}
    </h2>

    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {#each instructors as instructor (instructor.id)}
        <article class="ui:bg-card ui:border-border flex flex-col rounded-lg border p-6">
          {#if instructor.avatarUrl}
            <img
              src={instructor.avatarUrl}
              alt={instructor.name}
              class="mb-4 h-16 w-16 rounded-full object-cover"
              loading="lazy"
            />
          {/if}

          <h3 class="ui:text-foreground text-base font-semibold">{instructor.name}</h3>

          <p class="ui:text-muted-foreground text-sm">{instructor.role}</p>

          {#if instructor.bio}
            <p class="ui:text-muted-foreground mt-3 text-sm leading-relaxed">{instructor.bio}</p>
          {/if}
        </article>
      {/each}
    </div>
  </section>
{/if}
