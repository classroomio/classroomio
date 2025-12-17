<script>
  import { Label } from '@cio/ui/base/label';
  import { Switch } from '@cio/ui/base/switch';

  import { issueCertificateModal, resetForm } from './store';
  import { preventDefault } from '$lib/utils/functions/svelte';

  import * as Dialog from '@cio/ui/base/dialog';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { InputField } from '@cio/ui/custom/input-field';
  import { Button } from '@cio/ui/base/button';

  let isAutomatic = $state(false);

  const issueCertificate = () => {
    resetForm();
  };
</script>

<Dialog.Root
  bind:open={$issueCertificateModal.open}
  onOpenChange={(isOpen) => {
    if (!isOpen) resetForm();
  }}
>
  <Dialog.Content class="w-3/5">
    <Dialog.Header>
      <Dialog.Title>Send Certificate</Dialog.Title>
    </Dialog.Header>
    <main>
    <div>
      <div class="mb-4 flex items-center space-x-2">
        <Switch id="auto-certificate" bind:checked={isAutomatic} />
        <Label for="auto-certificate" class="text-sm font-medium">Automatic</Label>
      </div>
      <p class="my-4 text-sm font-medium">
        If you set this as automatic, certificates will be issued after the learner completes the course.
      </p>
    </div>
    <p class="my-4 text-xs font-normal text-gray-500">or send a personalised/ custom certificate below:</p>
    <form onsubmit={preventDefault(issueCertificate)}>
      <div class="flex w-full flex-col gap-2 md:flex-row">
        <InputField
          label="Email address of the student"
          className="w-full my-4"
          labelClassName="text-xs font-normal"
          placeholder="email,comma seperated"
          bind:value={$issueCertificateModal.email}
        />
        <InputField
          label="Schedule date"
          className="w-full my-4"
          labelClassName="text-xs font-normal"
          placeholder="12/06/2023"
          bind:value={$issueCertificateModal.date}
        />
      </div>

      <TextareaField
        label="Add a personalized message"
        labelClassName="text-xs font-normal"
        bind:value={$issueCertificateModal.message}
        rows={2}
        placeholder="your message here"
        className="mb-4"
      />

      <div class="mt-5 flex w-full items-end justify-end">
        <Button type="submit">Issue certificate</Button>
      </div>
    </form>
  </main>
  </Dialog.Content>
</Dialog.Root>
