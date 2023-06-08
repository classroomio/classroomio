<script>
  import { fly } from 'svelte/transition';
  import { themeImages } from '../../../utils/constants/quiz';

  const quiz = {};
  const currentTheme = 'standard';
</script>

<div
  class="absolute inset-0 z-50 bg-white h-screen w-screen"
  in:fly={{ y: 500, duration: 500 }}
  out:fly={{ y: 500, duration: 500 }}
>
  <div
    class="p-5 h-full w-full"
    style="background: url({themeImages[currentTheme]
      .play}) no-repeat center center fixed; -webkit-background-size: cover;-moz-background-size: cover;-o-background-size: cover;background-size: cover;"
  >
    something
  </div>
</div>
