<script>
  import TextField from '../../../../Form/TextField.svelte';
  import TextArea from '../../../../Form/TextArea.svelte';
  import { certInfo } from '../store';

  let borderwidth = 'border-4';
  let bordercolor = 'border-pink-700';
  let logo = './certLogo.png';
</script>

<div
  class="flex flex-col items-center justify-center {borderwidth} {bordercolor}"
>
  <div>
    <img src={logo} alt="logo" />
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
        bind:value={$certInfo.Name}
        inputClassName="text-center placeholder:text-black"
        placeholder="Name of student"
        bgColor="bg-transparent"
      />
    </div>
    <div class="mb-2">
      <p class="text-xs text-black font-medium">
        has successfully completed a courses in
      </p>
      <TextArea
        bind:value={$certInfo.Title}
        inputClassName=""
        placeholder="Name of course"
        bgColor="clamp bg-transparent text-base font-semibold text-pink-700 text-center placeholder:text-black placeholder:text-base placeholder:font-semibold uppercase resize-none"
        rows="1"
        maxRows="2"
      />
    </div>
    <p class="desc text-center">{$certInfo.Desc}</p>
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
