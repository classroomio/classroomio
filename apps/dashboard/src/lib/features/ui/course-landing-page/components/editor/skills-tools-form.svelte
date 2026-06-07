<script lang="ts">
  import XIcon from '@lucide/svelte/icons/x';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import { Input } from '@cio/ui/base/input';
  import { Button } from '@cio/ui/base/button';

  import type { Course } from '$features/course/utils/types';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    course: Course;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setter: (value: any, key: string) => void;
  }

  let { course = $bindable(), setter }: Props = $props();

  let skillsDraft = $state('');
  let toolsDraft = $state('');

  const skills = $derived((course.metadata?.skills ?? []) as string[]);
  const tools = $derived((course.metadata?.tools ?? []) as string[]);

  function addSkill() {
    const value = skillsDraft.trim();
    if (!value) return;
    if (skills.includes(value)) {
      skillsDraft = '';
      return;
    }
    setter([...skills, value], 'metadata.skills');
    skillsDraft = '';
  }

  function removeSkill(skill: string) {
    setter(
      skills.filter((s) => s !== skill),
      'metadata.skills'
    );
  }

  function addTool() {
    const value = toolsDraft.trim();
    if (!value) return;
    if (tools.includes(value)) {
      toolsDraft = '';
      return;
    }
    setter([...tools, value], 'metadata.tools');
    toolsDraft = '';
  }

  function removeTool(tool: string) {
    setter(
      tools.filter((t) => t !== tool),
      'metadata.tools'
    );
  }

  function handleSkillKey(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      addSkill();
    }
  }

  function handleToolKey(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      addTool();
    }
  }
</script>

<div class="flex flex-col gap-6">
  <div>
    <p class="mb-2 text-sm font-semibold">
      {$t('course.navItem.landing_page.editor.title.skills')}
    </p>
    <p class="mb-3 text-xs text-gray-500">
      {$t('course.navItem.landing_page.editor.skills_help')}
    </p>

    <div class="flex gap-2">
      <Input
        bind:value={skillsDraft}
        onkeydown={handleSkillKey}
        placeholder={$t('course.navItem.landing_page.editor.skills_placeholder')}
      />
      <Button type="button" variant="outline" size="sm" onclick={addSkill} disabled={!skillsDraft.trim()}>
        <PlusIcon size={14} />
      </Button>
    </div>

    {#if skills.length > 0}
      <div class="mt-3 flex flex-wrap gap-2">
        {#each skills as skill (skill)}
          <span
            class="inline-flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-700"
          >
            {skill}
            <button
              type="button"
              class="text-gray-400 hover:text-gray-700"
              onclick={() => removeSkill(skill)}
              aria-label={$t('course.navItem.landing_page.editor.remove')}
            >
              <XIcon size={12} />
            </button>
          </span>
        {/each}
      </div>
    {/if}
  </div>

  <div>
    <p class="mb-2 text-sm font-semibold">
      {$t('course.navItem.landing_page.editor.title.tools')}
    </p>
    <p class="mb-3 text-xs text-gray-500">
      {$t('course.navItem.landing_page.editor.tools_help')}
    </p>

    <div class="flex gap-2">
      <Input
        bind:value={toolsDraft}
        onkeydown={handleToolKey}
        placeholder={$t('course.navItem.landing_page.editor.tools_placeholder')}
      />
      <Button type="button" variant="outline" size="sm" onclick={addTool} disabled={!toolsDraft.trim()}>
        <PlusIcon size={14} />
      </Button>
    </div>

    {#if tools.length > 0}
      <div class="mt-3 flex flex-wrap gap-2">
        {#each tools as tool (tool)}
          <span
            class="inline-flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-700"
          >
            {tool}
            <button
              type="button"
              class="text-gray-400 hover:text-gray-700"
              onclick={() => removeTool(tool)}
              aria-label={$t('course.navItem.landing_page.editor.remove')}
            >
              <XIcon size={12} />
            </button>
          </span>
        {/each}
      </div>
    {/if}
  </div>
</div>
