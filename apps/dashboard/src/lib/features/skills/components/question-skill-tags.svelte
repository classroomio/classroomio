<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { MultiSelectList } from '@cio/ui/custom/multi-select-list';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import TargetIcon from '@lucide/svelte/icons/target';

  import { skillsApi } from '$features/skills/api';
  import { buildSkillRows, type QuestionSkillTag, type SuggestedSkill } from '$features/skills/utils';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    courseId: string;
    exerciseId: string;
    questionId: number | string | undefined;
    title: string;
    description?: string;
    options?: string[];
    tags: QuestionSkillTag[];
    onSaved: () => void;
  }

  let { courseId, exerciseId, questionId, title, description, options, tags, onSaved }: Props = $props();

  let open = $state(false);
  let search = $state('');
  let selected = $state<string[]>([]);
  let suggestions = $state<SuggestedSkill[]>([]);
  let isSuggesting = $state(false);
  let isSaving = $state(false);

  const numericQuestionId = $derived(typeof questionId === 'number' ? questionId : Number(questionId));
  const canTag = $derived(Number.isInteger(numericQuestionId) && numericQuestionId > 0);
  const rows = $derived(buildSkillRows(skillsApi.skills, search));
  const items = $derived(
    rows.map((row) => ({
      id: row.id,
      label: `${'\u00a0\u00a0'.repeat(row.depth)}${row.code} · ${row.name}`
    }))
  );
  const skillIdByCode = $derived(new Map(skillsApi.skills.map((skill) => [skill.code, skill.id])));

  async function openPicker() {
    if (!skillsApi.hasLoaded) await skillsApi.list();

    selected = tags.map((tag) => tag.skillId);
    suggestions = [];
    search = '';
    open = true;
  }

  function toggle(skillId: string) {
    selected = selected.includes(skillId) ? selected.filter((id) => id !== skillId) : [...selected, skillId];
  }

  async function handleSuggest() {
    isSuggesting = true;
    suggestions = (await skillsApi.suggest(courseId, { title, description, options })) ?? [];
    isSuggesting = false;
  }

  async function handleSave() {
    isSaving = true;
    const saved = await skillsApi.setQuestionSkills(courseId, exerciseId, numericQuestionId, selected);
    isSaving = false;

    if (!saved) return;

    open = false;
    onSaved();
  }
</script>

<div class="mt-3 flex flex-wrap items-center gap-2" data-testid="question-skill-tags">
  <TargetIcon class="ui:text-muted-foreground size-4" />
  {#each tags as tag (tag.skillId)}
    <Badge variant="secondary" title={tag.name}>{tag.code}</Badge>
  {/each}
  {#if canTag}
    <Button variant="ghost" size="sm" onclick={openPicker} testId="question-skill-open">
      {$t(tags.length ? 'skills.picker.edit' : 'skills.picker.add')}
    </Button>
  {:else}
    <span class="ui:text-muted-foreground text-xs">{$t('skills.picker.save_first')}</span>
  {/if}
</div>

<Dialog.Root bind:open>
  <Dialog.Content class="max-w-xl">
    <Dialog.Header>
      <Dialog.Title>{$t('skills.picker.title')}</Dialog.Title>
      <Dialog.Description>{$t('skills.picker.description')}</Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4">
      <div class="flex items-center justify-between gap-2">
        <p class="text-sm font-medium">{$t('skills.picker.suggestions')}</p>
        <Button variant="outline" size="sm" onclick={handleSuggest} loading={isSuggesting} testId="question-skill-suggest">
          <SparklesIcon class="size-4" />
          {$t('skills.picker.suggest')}
        </Button>
      </div>

      {#if suggestions.length > 0}
        <ul class="space-y-2" data-testid="question-skill-suggestions">
          {#each suggestions as suggestion (suggestion.code)}
            {@const skillId = skillIdByCode.get(suggestion.code)}
            <li class="flex items-start justify-between gap-3 rounded-md border p-2 text-sm">
              <div>
                <p class="font-mono text-xs">{suggestion.code}</p>
                {#if suggestion.reason}<p class="ui:text-muted-foreground text-xs">{suggestion.reason}</p>{/if}
              </div>
              {#if skillId}
                <Button
                  size="sm"
                  variant={selected.includes(skillId) ? 'secondary' : 'outline'}
                  onclick={() => toggle(skillId)}
                  testId="question-skill-accept"
                >
                  {$t(selected.includes(skillId) ? 'skills.picker.accepted' : 'skills.picker.accept')}
                </Button>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}

      <MultiSelectList
        {items}
        emptyMessage={$t('skills.picker.empty')}
        isSelected={(id) => selected.includes(id)}
        onToggle={toggle}
        namePrefix="question-skill"
        searchPlaceholder={$t('skills.search_placeholder')}
        bind:searchValue={search}
        listClass="ui:max-h-64"
      />
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={() => (open = false)}>{$t('skills.actions.cancel')}</Button>
      <Button onclick={handleSave} loading={isSaving} testId="question-skill-save">{$t('skills.actions.save')}</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
