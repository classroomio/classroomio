<script>
  import TextField from '../../../../Form/TextField.svelte';
  import TextArea from '../../../../Form/TextArea.svelte';
  import { certificateInfo } from '../store';

  let borderwidth = 'border-l-8';
  let bordercolor = 'border-blue-800';
  let logo = './certLogo.png';
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
        <TextField
          bind:value={$certificateInfo.Name}
          inputClassName="text-center placeholder:text-black"
          placeholder="Name of student"
          bgColor="bg-transparent"
        />
      </div>
      <div class="mb-2">
        <p class="text-xs text-black font-medium">
          has successfully completed introductory courses in
        </p>
        <TextArea
          bind:value={$certificateInfo.Title}
          inputClassName=""
          placeholder="Name of course"
          bgColor="clamp bg-transparent font-semibold text-blue-800 text-center placeholder:text-black placeholder:text-base placeholder:font-semibold uppercase resize-none border-none"
          rows="1"
          maxRows="2"
        />
      </div>
      <p class="desc mb-2 text-justify">{$certificateInfo.Desc}</p>
      <div>
        <img src={logo} alt="logo" class="my-2" />
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
