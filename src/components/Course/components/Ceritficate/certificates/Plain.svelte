<script>
  import TextField from '../../../../Form/TextField.svelte';
  import { course } from '../../../store';
  import { currentOrg } from '../../../../../utils/store/org';

  export let studentName;
  let borderwidth = 'border-4';
  let bordercolor = 'border-pink-700';
  let logo = './logo-512.png';
</script>

<div
  class="flex flex-col items-center justify-center {borderwidth} {bordercolor}"
>
  <div class="flex items-center gap-1 my-2">
    <img
      src={$currentOrg.avatar_url ? $currentOrg.avatar_url : logo}
      alt="logo"
      class=" w-14 h-14 rounded-md"
    />
    <p class="font-semibold capitalize">{$currentOrg.name}</p>
  </div>
  <div class="w-full px-5 py-3">
    <p
      class="text-sm text-center font-normal my-2 uppercase tracking-wider text-gray-500 w-full"
    >
      Certificate of completion
    </p>
    <div class="border-b border-gray-500 mb-4">
      <p class="text-xs text-black font-medium">This is to certify that</p>
      <TextField
        bind:value={studentName}
        inputClassName="text-center placeholder:text-black"
        placeholder="Name of student"
        bgColor="bg-transparent"
      />
    </div>
    <div class="mb-2">
      <p class="text-xs text-black font-medium">
        has successfully completed a courses in
      </p>
      <div>
        <p
          class="clamp bg-transparent text-base font-semibold text-pink-700 text-center uppercase"
        >
          {$course.title}
        </p>
      </div>
    </div>
    <p class="desc text-center">{$course.description}</p>
  </div>
</div>

<style>
  .desc {
    font-size: 10px;
  }
  .clamp {
    font-size: clamp(14px, 3vw, 16px);
  }
</style>
