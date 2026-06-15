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

<div class="ui:relative">
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="ui:relative ui:cursor-pointer" onclick={openVideo} role="presentation">
    <img
      src={thumbnailSrc}
      alt={thumbnailAlt}
      width={1920}
      height={1080}
      class="ui:w-full ui:rounded-2xl ui:transition-all ui:duration-200"
    />
    <div class="ui:absolute ui:inset-0 ui:flex ui:items-center ui:justify-center">
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="ui:flex ui:size-24 ui:items-center ui:justify-center ui:rounded-full ui:border ui:border-neutral-400 ui:bg-black ui:backdrop-blur-md ui:transition-transform ui:duration-300 ui:ease-out"
        onmouseenter={() => (isPlayHovered = true)}
        onmouseleave={() => (isPlayHovered = false)}
        role="presentation"
      >
        <div
          class="ui:relative ui:flex ui:size-20 ui:items-center ui:justify-center ui:rounded-full ui:border ui:border-neutral-400 ui:bg-black ui:backdrop-blur-2xl ui:transition-all ui:duration-300 ui:ease-out"
        >
          <span
            class="ui:inline-flex ui:size-8 ui:items-center ui:justify-center ui:transition-transform ui:duration-300 ui:ease-out"
            style:transform={`scale(${isPlayHovered ? 1.1 : 1})`}
            style:color={iconColor}
          >
            <Play strokeWidth={1.7} class="ui:size-full" />
          </span>
        </div>
      </div>
    </div>
  </div>

  <AnimatePresence let:item list={[{ key: isVideoOpen }]}>
    {#if item.key}
      <Motion initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} let:motion>
        <div
          use:motion
          class="ui:fixed ui:inset-0 ui:z-50 ui:flex ui:items-center ui:justify-center ui:bg-black/50 ui:backdrop-blur-md"
        >
          <Motion
            initial={selectedAnimation.initial}
            animate={selectedAnimation.animate}
            exit={selectedAnimation.exit}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            let:motion
          >
            <div use:motion class="ui:relative ui:mx-4 ui:w-full ui:max-w-4xl ui:md:mx-0 aspect-video">
              <Motion let:motion whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <button
                  type="button"
                  use:motion
                  class="ui:absolute ui:-top-16 ui:right-0 ui:rounded-full ui:bg-neutral-900/50 ui:p-2 ui:text-xl ui:text-white ui:ring-1 ui:backdrop-blur-md"
                  onclick={closeVideo}
                  onmouseenter={() => (isCloseHovered = true)}
                  onmouseleave={() => (isCloseHovered = false)}
                >
                  <X class="ui:size-5 ui:text-white" />
                </button>
              </Motion>
              <Motion animate={{ scale: isCloseHovered ? 0.98 : 1 }} transition={{ duration: 0.2 }} let:motion>
                <div
                  use:motion
                  class="ui:relative ui:z-1 ui:size-full ui:overflow-hidden ui:rounded-2xl ui:border-2 ui:border-white isolate"
                >
                  <!-- svelte-ignore a11y_missing_attribute -->
                  <iframe
                    src={videoSrc}
                    class="ui:size-full ui:rounded-2xl"
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
