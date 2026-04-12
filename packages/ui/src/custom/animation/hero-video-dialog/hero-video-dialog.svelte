<script lang="ts">
  import { AnimatePresence, Motion } from 'svelte-motion';
  import { Play, X } from '@lucide/svelte';

  type AnimationStyle =
    | 'from-bottom'
    | 'from-center'
    | 'from-top'
    | 'from-left'
    | 'from-right'
    | 'fade'
    | 'top-in-bottom-out'
    | 'left-in-right-out';

  interface Props {
    animationStyle?: AnimationStyle;
    videoSrc: string;
    thumbnailSrc: string;
    thumbnailAlt?: string;
    iconColor?: string;
  }

  let {
    animationStyle = 'from-center',
    videoSrc,
    thumbnailSrc,
    thumbnailAlt = 'Video thumbnail',
    iconColor = 'white'
  }: Props = $props();

  let isVideoOpen = $state(false);
  let isCloseHovered = $state(false);
  let isPlayHovered = $state(false);

  function openVideo() {
    isVideoOpen = true;
  }

  function closeVideo() {
    isVideoOpen = false;
  }

  const animationVariants: Record<
    AnimationStyle,
    { initial: Record<string, number>; animate: Record<string, number>; exit: Record<string, number> }
  > = {
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

  const selectedAnimation = $derived(animationVariants[animationStyle]);
</script>

<div class="relative">
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="relative cursor-pointer" onclick={openVideo} role="presentation">
    <img
      src={thumbnailSrc}
      alt={thumbnailAlt}
      width={1920}
      height={1080}
      class="w-full rounded-2xl transition-all duration-200"
    />
    <div class="absolute inset-0 flex items-center justify-center">
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="flex size-24 items-center justify-center rounded-full border border-neutral-400 bg-black backdrop-blur-md transition-transform duration-300 ease-out"
        onmouseenter={() => (isPlayHovered = true)}
        onmouseleave={() => (isPlayHovered = false)}
        role="presentation"
      >
        <div
          class="relative flex size-20 items-center justify-center rounded-full border border-neutral-400 bg-black backdrop-blur-2xl transition-all duration-300 ease-out"
        >
          <span
            class="inline-flex size-8 items-center justify-center transition-transform duration-300 ease-out"
            style:transform={`scale(${isPlayHovered ? 1.1 : 1})`}
            style:color={iconColor}
          >
            <Play strokeWidth={1.7} class="size-full" />
          </span>
        </div>
      </div>
    </div>
  </div>

  <AnimatePresence let:item list={[{ key: isVideoOpen }]}>
    {#if item.key}
      <Motion initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} let:motion>
        <div use:motion class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md">
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
                  type="button"
                  use:motion
                  class="absolute -top-16 right-0 rounded-full bg-neutral-900/50 p-2 text-xl text-white ring-1 backdrop-blur-md"
                  onclick={closeVideo}
                  onmouseenter={() => (isCloseHovered = true)}
                  onmouseleave={() => (isCloseHovered = false)}
                >
                  <X class="size-5 text-white" />
                </button>
              </Motion>
              <Motion animate={{ scale: isCloseHovered ? 0.98 : 1 }} transition={{ duration: 0.2 }} let:motion>
                <div
                  use:motion
                  class="relative isolate z-1 size-full overflow-hidden rounded-2xl border-2 border-white"
                >
                  <!-- svelte-ignore a11y_missing_attribute -->
                  <iframe
                    src={videoSrc}
                    class="size-full rounded-2xl"
                    allowfullscreen
                    title="Video"
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
