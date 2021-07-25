<script>
  import TextField from '../components/Form/TextField.svelte';
  import Select from '../components/Form/Select.svelte';
  import PrimaryButton from '../components/PrimaryButton/index.svelte';

  let email;
  let userType = 0;

  const userTypes = [
    {
      text: '--Select an option--',
      value: 0,
    },
    {
      text: 'Student',
      value: 1,
    },
    {
      text: 'Organization/Teacher',
      value: 2,
    },
  ];

  function handleSubmit() {
    console.log(`email`, email);
  }
</script>

<svelte:head>
  <title>Join ClassroomIO</title>
</svelte:head>

<div class="w-full h-screen flex items-center justify-center ">
  <div class="container border border-gray-300 rounded-md p-12">
    <form
      on:submit|preventDefault={handleSubmit}
      class="flex items-center flex-col w-full"
    >
      <img
        src="/logo-192.png"
        alt="ClassroomIO logo"
        height="70"
        width="70"
        data-atf="1"
      />
      <h4 class="text-lg m-0 mt-3">Signup</h4>
      <p class="text-sm">for ClassroomIO</p>

      <div class="my-4 w-full">
        <Select
          label="Who are you?"
          bind:value={userType}
          options={userTypes}
          valueKey="value"
        />
      </div>

      <div class="my-4 w-full">
        <TextField
          bind:value={email}
          autofocus={true}
          label="Email"
          type="email"
          placeholder="Enter your email"
          onKeyDown={handleSubmit}
          inputClassName="rounded-md w-full px-2 py-4"
        />
        <p class="py-3 text-sm">
          A magic link will be sent to your email, please open the link
        </p>
      </div>

      <div class="my-4 w-full flex justify-between items-center">
        <a href="/login" class="text-blue-700 text-sm">I have an account</a>
        <PrimaryButton label="Next" type="submit" className="py-2 px-4" />
      </div>
    </form>
  </div>
</div>

<style>
  .container {
    width: 450px;
  }
</style>
