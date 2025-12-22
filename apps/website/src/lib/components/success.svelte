<script>
  import { goto } from '$app/navigation';

  import { Button } from '@cio/ui/base/button';
</script>

<div
  class="relative overflow-hidden mt-10 flex space-y-3 flex-col text-center items-center border border-[#D9E0F5] justify-center w-full rounded-md min-h-[300px] p-4 bg-[#F5F8FE]"
>
  <div class="absolute w-20 h-20 bg-[#0233BD] -top-14 -left-9 rotate-[50deg]" />
  <h1 class="font-bold text-3xl">Your message has been sent 🎉</h1>
  <p class="w-[70%] font-normal text-sm">
    We'll get back to you as soon as possible. In the meantime, Explore and enjoy features on our
    website
  </p>
  <Button class="px-10 md:px-20" onclick={() => goto('/')}>Go to Home</Button>
</div>
