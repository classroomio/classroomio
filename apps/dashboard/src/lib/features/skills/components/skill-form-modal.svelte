<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import * as Select from '@cio/ui/base/select';
  import { Button } from '@cio/ui/base/button';
  import { InputField } from '@cio/ui/custom/input-field';
  import { TextareaField } from '@cio/ui/custom/textarea-field';

  import { skillsApi } from '$features/skills/api';
  import { buildSkillRows, getDescendantIds, type Skill } from '$features/skills/utils';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    open?: boolean;
    skill?: Skill | null;
  }

  const NO_PARENT = 'none';

  let { open = $bindable(false), skill = null }: Props = $props();

  let code = $state('');
  let name = $state('');
  let description = $state('');
  let framework = $state('');
  let parentId = $state(NO_PARENT);

  const parentOptions = $derived.by(() => {
    const excluded = skill ? getDescendantIds(skillsApi.skills, skill.id) : new Set<string>();

    return buildSkillRows(skillsApi.skills).filter((row) => !excluded.has(row.id));
  });
  const parentLabel = $derived(
    parentOptions.find((row) => row.id === parentId)?.code ?? $t('skills.form.no_parent')
  );

  $effect(() => {
    if (!open) return;

    code = skill?.code ?? '';
    name = skill?.name ?? '';
    description = skill?.description ?? '';
    framework = skill?.framework ?? '';
    parentId = skill?.parentId ?? NO_PARENT;
  });

  function handleOpenChange(nextOpen: boolean) {
    open = nextOpen;
    if (!nextOpen) skillsApi.reset();
  }

  async function handleSubmit() {
    const fields = {
      code,
      name,
      description: description || null,
      framework: framework || null,
      parentId: parentId === NO_PARENT ? null : parentId
    };
    const saved = skill ? await skillsApi.update(skill.id, fields) : await skillsApi.create(fields);

    if (saved) handleOpenChange(false);
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="sm:max-w-lg">
    <Dialog.Header>
      <Dialog.Title>{$t(skill ? 'skills.form.edit_title' : 'skills.form.create_title')}</Dialog.Title>
    </Dialog.Header>

    <div class="space-y-4 py-2">
      <InputField
        label={$t('skills.form.code')}
        placeholder="CCSS.MATH.6.EE.A.1"
        bind:value={code}
        errorMessage={skillsApi.errors.code}
        testId="skill-form-code"
        autoFocus
      />
      <InputField
        label={$t('skills.form.name')}
        bind:value={name}
        errorMessage={skillsApi.errors.name}
        testId="skill-form-name"
      />
      <TextareaField
        label={$t('skills.form.description')}
        bind:value={description}
        errorMessage={skillsApi.errors.description}
      />
      <InputField label={$t('skills.form.framework')} bind:value={framework} errorMessage={skillsApi.errors.framework} />

      <div class="space-y-2">
        <p class="text-sm font-medium">{$t('skills.form.parent')}</p>
        <Select.Root type="single" bind:value={parentId}>
          <Select.Trigger class="w-full" data-testid="skill-form-parent">{parentLabel}</Select.Trigger>
          <Select.Content class="max-h-72">
            <Select.Item value={NO_PARENT}>{$t('skills.form.no_parent')}</Select.Item>
            {#each parentOptions as option (option.id)}
              <Select.Item value={option.id}>
                <span style={`padding-left: ${option.depth * 12}px`}>{option.code} · {option.name}</span>
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={() => handleOpenChange(false)}>{$t('skills.actions.cancel')}</Button>
      <Button onclick={handleSubmit} loading={skillsApi.isLoading} testId="skill-form-save">
        {$t('skills.actions.save')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
