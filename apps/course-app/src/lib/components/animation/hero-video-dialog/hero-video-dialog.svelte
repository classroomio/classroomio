<script lang="ts">
  import { writable } from 'svelte/store';
  import { AnimatePresence, Motion } from 'svelte-motion';
  import { Play, X } from 'lucide-svelte';

  type AnimationStyle =
    | 'from-bottom'
    | 'from-center'
    | 'from-top'
    | 'from-left'
    | 'from-right'
    | 'fade'
    | 'top-in-bottom-out'
    | 'left-in-right-out';

  // interface HeroVideoProps {
  // 	animationStyle?: AnimationStyle;
  // 	videoSrc: string;
  // 	thumbnailSrc: string;
  // 	thumbnailAlt?: string;
  // }

  export let animationStyle: AnimationStyle = 'from-center';
  export let videoSrc: string;
  export let thumbnailSrc: string;
  export let thumbnailAlt: string = 'Video thumbnail';
  export let iconColor: string = 'white';

  const isVideoOpen = writable(false);
  const isCloseHovered = writable(false);
  const isPlayHovered = writable(false);

  function openVideo() {
    isVideoOpen.set(true);
  }

  function closeVideo() {
    isVideoOpen.set(false);
  }

  let animationVariants = {
    'from-bottom': {
      initial: { y: 100, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: 100, opacity: 0 }
    },
    'from-center': {
      initial: { scale: 0.5, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.5, opacity: 0 }
    },
    'from-top': {
      initial: { y: -100, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: -100, opacity: 0 }
    },
    'from-left': {
      initial: { x: -100, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: -100, opacity: 0 }
    },
    'from-right': {
      initial: { x: 100, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 100, opacity: 0 }
    },
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    },
    'top-in-bottom-out': {
      initial: { y: -100, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: 200, opacity: 0 }
    },
    'left-in-right-out': {
      initial: { x: -100, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 200, opacity: 0 }
    }
  };

  $: selectedAnimation = animationVariants[animationStyle];
</script>

<div class="relative">
  <!-- Thumbnail -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div class="relative cursor-pointer" on:click={openVideo}>
    <img
      src={thumbnailSrc}
      alt={thumbnailAlt}
      width={1920}
      height={1080}
      class="w-full rounded-2xl transition-all duration-200"
    />
    <!-- {$isPlayHovered===true ? 'blur-[2px]' :'' } to make background blur put this in above img class -->
    <div class="absolute inset-0 flex items-center justify-center">
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        class="flex size-24 items-center justify-center rounded-full border border-neutral-400 bg-black backdrop-blur-md transition-transform duration-300 ease-out"
        on:mouseenter={() => isPlayHovered.set(true)}
        on:mouseleave={() => isPlayHovered.set(false)}
      >
        <div
          class="relative flex size-20 items-center justify-center rounded-full border border-neutral-400 bg-black backdrop-blur-2xl transition-all duration-300 ease-out"
          class:isPlayHovered={$isPlayHovered}
        >
          <Play
            strokeWidth={1.7}
            class="size-8"
            style="transform: scale({$isPlayHovered ? 1.1 : 1}); transition: transform 0.3s ease;
			color: {iconColor};
			"
          />
        </div>
      </div>
    </div>
  </div>

  <AnimatePresence let:item list={[{ key: $isVideoOpen }]}>
    {#if item.key}
      <Motion initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} let:motion>
        <div
          use:motion
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"
        >
          <!-- Modal Content -->
          <Motion
            initial={selectedAnimation.initial}
            animate={selectedAnimation.animate}
            exit={selectedAnimation.exit}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            let:motion
          >
            <div use:motion class="relative mx-4 aspect-video w-full max-w-4xl md:mx-0">
              <Motion let:motion whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <button
                  use:motion
                  class="absolute -top-16 right-0 rounded-full bg-neutral-900/50 p-2 text-xl text-white ring-1 backdrop-blur-md"
                  on:click={closeVideo}
                  on:mouseenter={() => isCloseHovered.set(true)}
                  on:mouseleave={() => isCloseHovered.set(false)}
                >
                  <X class="size-5" />
                </button>
              </Motion>
              <Motion
                animate={{ scale: $isCloseHovered ? 0.98 : 1 }}
                transition={{ duration: 0.2 }}
                let:motion
              >
                <div
                  use:motion
                  class="relative isolate z-[1] size-full overflow-hidden rounded-2xl border-2 border-white"
                >
                  <!-- svelte-ignore a11y-missing-attribute -->
                  <iframe
                    src={videoSrc}
                    class="size-full rounded-2xl"
                    allowfullscreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  ></iframe>
                </div>
              </Motion>
            </div>
          </Motion>
        </div>
      </Motion>
    {/if}
  </AnimatePresence>
</div>

<style>
  .size-24 {
    width: 6rem;
    height: 6rem;
  }
  .size-20 {
    width: 5rem;
    height: 5rem;
  }
  .size-8 {
    width: 2rem;
    height: 2rem;
  }
  .size-full {
    width: 100%;
    height: 100%;
  }
</style>
