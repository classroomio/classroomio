<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { Input } from '@cio/ui/base/input';
  import { Textarea } from '@cio/ui/base/textarea';
  import { Label } from '@cio/ui/base/label';
  import { t } from '$lib/utils/functions/translations';
  import { slugify } from '../utils/learning-path-utils';
  import { learningPathApi } from '../api';

  interface Props {
    open: boolean;
    onClose: () => void;
    onCreated: (newPathId: string) => void;
  }

  let { open = $bindable(false), onClose, onCreated }: Props = $props();

  let name = $state('');
  let slug = $state('');
  let description = $state('');
  let isCustomSlug = $state(false);
  let isSubmitting = $state(false);

  function handleNameInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    name = val;
    if (!isCustomSlug) {
      slug = slugify(val);
    }
  }

  function handleSlugInput(e: Event) {
    isCustomSlug = true;
    slug = (e.target as HTMLInputElement).value;
  }

  function handleOpenChange(isOpen: boolean) {
    open = isOpen;
    if (!isOpen) {
      resetForm();
      onClose();
    }
  }

  function resetForm() {
    name = '';
    slug = '';
    description = '';
    isCustomSlug = false;
    isSubmitting = false;
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    isSubmitting = true;
    try {
      const generatedSlug = slug.trim() || slugify(name);
      const newId = await learningPathApi.createPath({
        name: name.trim(),
        slug: generatedSlug,
        description: description.trim() || undefined
      });

      resetForm();
      open = false;
      onCreated(newId);
    } catch {
      // Handled by BaseApiWithErrors
    } finally {
      isSubmitting = false;
    }
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="bg-card text-foreground border-border max-w-md border">
    <form onsubmit={handleSubmit}>
      <Dialog.Header>
        <Dialog.Title class="text-foreground text-lg font-semibold">
          {$t('learningPath.modals.create.title')}
        </Dialog.Title>
        <Dialog.Description class="text-muted-foreground text-sm">
          {$t('learningPath.modals.create.description')}
        </Dialog.Description>
      </Dialog.Header>

      <div class="my-4 space-y-4">
        <div class="space-y-1.5">
          <Label for="lp-name" class="text-foreground text-xs font-semibold">
            {$t('learningPath.modals.create.name_label')} *
          </Label>
          <Input
            id="lp-name"
            value={name}
            oninput={handleNameInput}
            placeholder={$t('learningPath.modals.create.name_placeholder')}
            required
            class="w-full"
          />
        </div>

        <div class="space-y-1.5">
          <Label for="lp-slug" class="text-foreground text-xs font-semibold">
            {$t('learningPath.modals.create.slug_label')}
          </Label>
          <Input
            id="lp-slug"
            value={slug}
            oninput={handleSlugInput}
            placeholder={$t('learningPath.modals.create.slug_placeholder')}
            class="w-full font-mono text-xs"
          />
        </div>

        <div class="space-y-1.5">
          <Label for="lp-desc" class="text-foreground text-xs font-semibold">
            {$t('learningPath.modals.create.desc_label')}
          </Label>
          <Textarea
            id="lp-desc"
            bind:value={description}
            placeholder={$t('learningPath.modals.create.desc_placeholder')}
            rows={3}
            class="w-full resize-none text-xs"
          />
        </div>
      </div>

      <Dialog.Footer class="gap-2 sm:gap-0">
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
        <Button type="submit" variant="primary" disabled={!name.trim() || isSubmitting}>
          {#if isSubmitting}
            {$t('learningPath.modals.create.creating')}
          {:else}
            {$t('learningPath.modals.create.submit')}
          {/if}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
