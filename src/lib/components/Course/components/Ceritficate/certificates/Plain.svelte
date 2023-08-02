<script>
  import { course } from '$lib/components/Course/store';
  import { currentOrg } from '$lib/utils/store/org';

  export let studentName = '';
  let borderwidth = 'border-4';
  let bordercolor = 'border-pink-700';
  let logo = './logo-512.png';
</script>

<div
  class="certificate-bg flex flex-col items-center justify-center {borderwidth} {bordercolor} py-3"
>
  <div class="flex items-center gap-1 my-2">
    <img
      src={$currentOrg.avatar_url ? $currentOrg.avatar_url : logo}
      alt="logo"
      class=" w-10 h-10 rounded-md"
    />
    <p class="font-semibold capitalize dark:text-black">{$currentOrg.name}</p>
  </div>
  <div class="w-full px-5 py-3">
    <p class="text-sm text-center font-normal my-2 uppercase tracking-widest text-gray-500 w-full">
      Certificate of completion
    </p>
    <div class="border-b border-gray-500 mb-4">
      <p class="text-xs text-black font-medium">This is to certify that</p>
      <p class="student-name text-center text-5xl dark:text-black">{studentName}</p>
    </div>
    <div class="mb-2">
      <p class="text-xs text-black font-medium">has successfully completed the course</p>
      <div>
        <p class="clamp bg-transparent text-base font-semibold text-pink-700 text-center uppercase">
          {$course.title}
        </p>
      </div>
    </div>
    <p class="desc text-center dark:text-black">{$course.description}</p>
  </div>
</div>

<style>
  .student-name {
    font-family: 'Qwitcher Grypen', cursive;
  }
  .desc {
    font-size: 10px;
  }
  .clamp {
    font-size: clamp(14px, 3vw, 16px);
  }
  .certificate-bg {
    background-color: #f5f8fe;
  }
</style>
