<script>
  import { Label } from '@cio/ui/base/label';
  import { Switch } from '@cio/ui/base/switch';

  import { issueCertificateModal, resetForm } from './store';
  import { preventDefault } from '$lib/utils/functions/svelte';

  import Modal from '$lib/components/Modal/index.svelte';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import { Button } from '@cio/ui/base/button';

  let isAutomatic = $state(false);

  const issueCertificate = () => {
    resetForm();
  };
</script>

<Modal
  onClose={resetForm}
  bind:open={$issueCertificateModal.open}
  width="w-3/5"
  maxWidth=""
  modalHeading="Send Certificate"
>
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
        <TextField
          label="Email address of the student"
          className="w-full my-4"
          labelClassName="text-xs font-normal"
          inputClassName="text-sm placeholder:text-sm placeholder:font-medium "
          placeholder="email,comma seperated"
          bind:value={$issueCertificateModal.email}
        />
        <TextField
          label="Schedule date"
          className="w-full my-4"
          labelClassName="text-xs font-normal"
          inputClassName="text-sm placeholder:text-sm placeholder:font-medium "
          placeholder="12/06/2023"
          bind:value={$issueCertificateModal.date}
        />
      </div>

      <TextArea
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
</Modal>
