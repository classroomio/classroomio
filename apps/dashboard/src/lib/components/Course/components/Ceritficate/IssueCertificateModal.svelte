<script>
  import { preventDefault } from '$lib/utils/functions/svelte';

  import { Toggle } from 'carbon-components-svelte';
  import Modal from '$lib/components/Modal/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import { issueCertificateModal, resetForm } from './store';

  const onToggle = (e) => {
    console.log(e);
  };

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
      <Toggle
        labelText="Automatically send certificates on completion"
        on:toggle={(e) => onToggle(e)}
        size="sm"
        class="mb-4"
      >
        <span slot="labelA" style="color: #161616">Automatic</span>
        <span slot="labelB" style="color: green">Automatic</span>
      </Toggle>
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
        <PrimaryButton className="px-6 py-3 rounded-md text-sm font-medium" label="Issue certificate" type="submit" />
      </div>
    </form>
  </main>
</Modal>
