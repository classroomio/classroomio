<script>
  import { course } from '../../../store';
  import { currentOrg } from '../../../../../utils/store/org';

  export let studentName;
  let borderwidth = 'border-l-8';
  let bordercolor = 'border-blue-800';
  let logo = './logo-512.png';
</script>

<div
  class="flex items-center justify-center border border-dashed border-blue-400"
>
  <div class="{borderwidth} {bordercolor}">
    <div class="w-full px-5 py-3">
      <p class="text-sm font-normal my-2 uppercase text-gray-500">
        Certificate<br /> of completion
      </p>
      <div class="border-b border-gray-500 mb-4">
        <p class="text-xs text-black font-medium">This is to certify that</p>
        <p class="text-center">{studentName}</p>
      </div>
      <div class="mb-2">
        <p class="text-xs text-black font-medium">
          has successfully completed introductory courses in
        </p>
        <div>
          <p
            class="clamp bg-transparent text-base font-semibold text-blue-800 text-center uppercase"
          >
            {$course.title}
          </p>
        </div>
      </div>
      <p class="desc mb-2 text-justify">{$course.description}</p>
      <div class="flex items-center gap-1 my-2">
        <img
          src={$currentOrg.avatar_url ? $currentOrg.avatar_url : logo}
          alt="logo"
          class="w-14 h-14 rounded-md"
        />
        <p class="font-semibold capitalize">{$currentOrg.name}</p>
      </div>
    </div>
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
