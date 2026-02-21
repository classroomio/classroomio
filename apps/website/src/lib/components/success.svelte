<script>
  import { goto } from '$app/navigation';

  import { Button } from '@cio/ui/base/button';
</script>

<div
  class="relative mt-10 flex min-h-[300px] w-full flex-col items-center justify-center space-y-3 overflow-hidden rounded-md border border-[#D9E0F5] bg-[#F5F8FE] p-4 text-center"
>
  <div class="absolute -top-14 -left-9 h-20 w-20 rotate-[50deg] bg-[#0233BD]"></div>
  <h1 class="text-3xl font-bold">Your message has been sent 🎉</h1>
  <p class="w-[70%] text-sm font-normal">
    We'll get back to you as soon as possible. In the meantime, Explore and enjoy features on our website
  </p>
  <Button class="px-10 md:px-20" onclick={() => goto('/')}>Go to Home</Button>
</div>
