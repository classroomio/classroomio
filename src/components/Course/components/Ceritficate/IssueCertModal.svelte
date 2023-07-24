<script>
  import { Toggle } from 'carbon-components-svelte';
  import Modal from '../../../Modal/index.svelte';
  import PrimaryButton from '../../../PrimaryButton/index.svelte';
  import TextArea from '../../../Form/TextArea.svelte';
  import TextField from '../../../Form/TextField.svelte';
  import { issueCertModal, resetForm } from './store';

  const onToggle = (e) => {
    console.log(e);
  };

  const issueCert = () => {
    resetForm();
  };
</script>

<Modal
  onClose={resetForm}
  bind:open={$issueCertModal.open}
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
      <p class="text-sm font-medium my-4">
        If you set this as automatic, certificates will be issued after the
        learner completes the course.
      </p>
    </div>
    <p class="text-xs font-normal text-gray-500 my-4">
      or send a personalised/ custom certificate below:
    </p>
    <form on:submit|preventDefault={issueCert}>
      <div class="flex flex-col md:flex-row gap-2 w-full">
        <TextField
          label="Email address of the student"
          className="w-full my-4"
          labelClassName="text-xs font-normal"
          inputClassName="text-sm placeholder:text-sm placeholder:font-medium "
          placeholder="email,comma seperated"
          bind:value={$issueCertModal.email}
        />
        <TextField
          label="Schedule date"
          className="w-full my-4"
          labelClassName="text-xs font-normal"
          inputClassName="text-sm placeholder:text-sm placeholder:font-medium "
          placeholder="12/06/2023"
          bind:value={$issueCertModal.date}
        />
      </div>

      <TextArea
        label="Add a personalized message"
        labelClassName="text-xs font-normal"
        bind:value={$issueCertModal.message}
        rows="2"
        maxRows="3"
        placeholder="your message here"
        className="mb-4"
      />

      <div class="mt-5 flex w-full items-end justify-end">
        <PrimaryButton
          className="px-6 py-3 rounded-md text-sm font-medium"
          label="Issue certificate"
          type="submit"
        />
      </div>
    </form>
  </main>
</Modal>
