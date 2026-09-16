<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { InputField } from '@cio/ui/custom/input-field';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { t } from '$lib/utils/functions/translations';
  import { slugify } from '../utils/learning-path-utils';
  import { learningPathApi } from '../api';

  interface Props {
    open?: boolean;
    onClose?: () => void;
    onCreated?: (newPathId: string) => void;
  }

  let { open = $bindable(false), onClose = () => {}, onCreated = () => {} }: Props = $props();

  let name = $state('');
  let description = $state('');
  let isSubmitting = $state(false);
  let errorMessage = $state<string | undefined>();

  const cannotSubmit = $derived(!name.trim() || !description.trim() || isSubmitting);

  function handleOpenChange(isOpen: boolean) {
    open = isOpen;
    if (!isOpen) {
      resetForm();
      onClose();
    }
  }

  function resetForm() {
    name = '';
    description = '';
    isSubmitting = false;
    errorMessage = undefined;
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (cannotSubmit) return;

    isSubmitting = true;
    errorMessage = undefined;

    try {
      const rawSlug = slugify(name.trim());
      const generatedSlug = rawSlug || `path-${Date.now().toString().slice(-4)}`;
      const newId = await learningPathApi.createPath({
        name: name.trim(),
        slug: generatedSlug,
        description: description.trim()
      });

      const targetId = newId;
      resetForm();
      open = false;
      onCreated(targetId);
    } catch (err: unknown) {
      errorMessage = err instanceof Error ? err.message : $t('learningPath.modals.create.failed');
    } finally {
      isSubmitting = false;
    }
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="mx-auto w-4/5 max-w-2xl md:w-2/5 md:min-w-150">
    <Dialog.Header>
      <Dialog.Title>{$t('learningPath.modals.create.title')}</Dialog.Title>
    </Dialog.Header>

    <form onsubmit={handleSubmit}>
      <div class="my-4 space-y-4">
        <InputField
          label={$t('learningPath.modals.create.name_label')}
          placeholder={$t('learningPath.modals.create.name_placeholder')}
          className="w-full"
          isRequired={true}
          bind:value={name}
          {errorMessage}
          autoComplete={false}
          autoFocus={true}
        />

        <TextareaField
          label={$t('learningPath.modals.create.desc_label')}
          bind:value={description}
          rows={3}
          placeholder={$t('learningPath.modals.create.desc_placeholder')}
          className="mb-4"
          isRequired={true}
        />
      </div>

      <Dialog.Footer>
        <Button
          type="button"
          variant="outline"
          onclick={() => {
            open = false;
            onClose();
          }}
        >
          {$t('learningPath.modals.create.cancel')}
        </Button>
        <Button type="submit" disabled={cannotSubmit} loading={isSubmitting}>
          {$t('learningPath.modals.create.submit')}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
