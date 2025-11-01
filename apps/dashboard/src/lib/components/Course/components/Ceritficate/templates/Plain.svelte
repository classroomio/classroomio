<script lang="ts">
  import { course } from '$lib/components/Course/store';
  import { currentOrg } from '$lib/utils/store/org';

  interface Props {
    studentName?: string;
  }

  let { studentName = '' }: Props = $props();
  const borderwidth = 'border-4';
  const bordercolor = 'border-pink-700';
  const logo = '/logo-512.png';
</script>

<div class="certificate-bg flex w-full flex-col items-center justify-center {borderwidth} {bordercolor} py-3">
  <div class="my-2 flex items-center gap-1">
    <img src={$currentOrg.avatar_url ? $currentOrg.avatar_url : logo} alt="logo" class=" h-10 w-10 rounded-md" />
    <p class="font-semibold capitalize dark:text-black">{$currentOrg.name}</p>
  </div>
  <div class="w-full px-5 py-3">
    <p class="my-2 w-full text-center text-sm font-normal uppercase tracking-widest text-gray-500">
      Certificate of completion
    </p>
    <div class="mb-4 border-b border-gray-500">
      <p class="text-xs font-medium text-black">This is to certify that</p>
      <p class="student-name text-center text-5xl dark:text-black">{studentName}</p>
    </div>
    <div class="mb-2">
      <p class="text-xs font-medium text-black">has successfully completed the course</p>
      <div>
        <p class="clamp bg-transparent text-center text-base font-semibold uppercase text-pink-700">
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
