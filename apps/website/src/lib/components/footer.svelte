<script lang="ts">
  import { onMount } from 'svelte';
  import { FOOTER_SOCIAL_LINKS } from './footer-icons';

  let footerEl: HTMLElement;
  let revealed = $state(false);
  let animDone = $state(false);
  let letterEls = $state<HTMLElement[]>([]);

  const site = 'https://classroomio.com/';

  const groups = [
    {
      title: 'Product',
      links: [
        ['AI Agents', '/#ncard-agents'],
        ['Branded Academies', '/#bx-academy'],
        ['Analytics', '/#hs'],
        ['Integrations', '/#bx-integrations'],
        ['Plugins', '/#bx-plugins'],
        ['Pricing', '/pricing']
      ]
    },
    {
      title: 'Solutions',
      links: [
        ['Customer Education', '/customer-education'],
        ['Partner Training', '/partner-training'],
        ['Cohort Training', '/cohort-training'],
        ['Certification Programs', '/certification-programs']
      ]
    },
    {
      title: 'For Devs',
      links: [
        ['API', `${site}developers`],
        ['MCP server & skills', `${site}mcp-recipes`],
        ['Self-hosting docs', `${site}docs`],
        ['GitHub', `${site}github`]
      ]
    },
    {
      title: 'Resources',
      links: [
        ['Customer stories', '/#story'],
        ['Blog', '/blog'],
        ['Help center', `${site}help`],
        ['Changelog', '/changelog'],
        ['Roadmap', `${site}roadmap`]
      ]
    },
    {
      title: 'Compare platforms',
      links: [
        'Skilljar',
        'LearnUpon',
        'Docebo',
        'Intellum',
        'Thought Industries',
        'Thinkific',
        'Teachfloor',
        'Teachable',
        'Kajabi',
        'Disco',
        'Trainn'
      ].map((name) => [name, `/alternatives/${name.toLowerCase().replace(/ /g, '-')}`])
    },
    {
      title: 'Company',
      links: [
        ['Roadmap', `${site}roadmap`],
        ['Support', `${site}help`],
        ['Privacy Policy', '/privacy'],
        ['Terms of Use', '/terms']
      ]
    }
  ] as const;

  const wordmarkLetters = [...'ClassroomIO'];

  function handlePointerMove(event: PointerEvent) {
    if (!animDone) return;
    letterEls.forEach((letter) => {
      const box = letter.getBoundingClientRect();
      const distance = Math.abs(event.clientX - (box.left + box.width / 2)) / box.width;
      letter.style.setProperty('--lift', (Math.exp((-distance * distance) / 2.2) * -0.14).toFixed(3) + 'em');
    });
  }

  function handlePointerLeave() {
    letterEls.forEach((letter) => letter.style.removeProperty('--lift'));
  }

  onMount(() => {
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      revealed = true;
      animDone = true;
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        revealed = true;
        setTimeout(() => (animDone = true), 1400);
        observer.disconnect();
      },
      { threshold: 0.18 }
    );
    observer.observe(footerEl);

    return () => observer.disconnect();
  });
</script>

<footer
  bind:this={footerEl}
  class="overflow-hidden border-t border-[var(--line)] bg-white"
  class:ft-revealed={revealed}
  class:ft-done={animDone}
  style="--line: #ebebed; --blue: #0542cc; --ink: #0e0f13; --muted: #6b6e76; --panel: #f5f5f4; --ease: cubic-bezier(0.22, 1, 0.36, 1); --spring: cubic-bezier(0.34, 1.56, 0.64, 1); --line-2: #e2e2e5;"
>
  <div class="mx-auto max-w-[1240px] px-12 pt-16 pb-7 max-md:px-4 max-md:pt-12 max-md:pb-6">
    <!-- Link columns -->
    <div class="grid grid-cols-6 gap-8 max-[980px]:grid-cols-2 max-[980px]:gap-x-4 max-[980px]:gap-y-7">
      {#each groups as group, i}
        <div class="ft-col grid content-start gap-3 text-[15px]" style="--i: {i};">
          <b class="mb-2.5 font-normal text-[var(--muted)]">{group.title}</b>
          {#each group.links as link}
            <a
              class="w-fit text-[var(--ink)] transition-colors duration-200 hover:text-[var(--blue)]"
              href={link[1]}
              style="background: linear-gradient(currentColor, currentColor) 0 100% / 0 1px no-repeat; transition: color 0.2s, background-size 0.3s var(--ease);"
              onmouseenter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundSize = '100% 1px';
              }}
              onmouseleave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundSize = '0 1px';
              }}>{link[0]}</a
            >
          {/each}
        </div>
      {/each}
    </div>

    <!-- Wordmark -->
    <div class="mt-[72px] flex items-center gap-[18px] select-none max-[980px]:mt-12 max-[980px]:gap-3">
      <img class="h-auto w-[50px] lg:w-[95px]" src="/home/images/logo.svg" alt="" />
      <span
        class="ft-wordmark -mb-[0.06em] inline-flex overflow-hidden pb-[0.06em] text-[80px] leading-[0.9] font-semibold tracking-[-0.055em] whitespace-nowrap text-[var(--ink)] max-[980px]:text-[12vw]"
        role="img"
        aria-label="ClassroomIO"
        onpointermove={handlePointerMove}
        onpointerleave={handlePointerLeave}
      >
        {#each wordmarkLetters as letter, idx}
          <i bind:this={letterEls[idx]} class="ft-letter inline-block not-italic" aria-hidden="true" style="--i: {idx};"
            >{letter}</i
          >
        {/each}
      </span>
    </div>

    <!-- Bottom bar -->
    <div
      class="mt-11 flex flex-wrap items-center justify-between gap-4 text-sm text-[var(--muted)] max-[980px]:flex-col max-[980px]:items-start"
    >
      <div>
        <a
          class="underline decoration-[var(--line-2)] underline-offset-[3px] transition-colors duration-200 hover:text-[var(--ink)] hover:decoration-current"
          href="/terms">Terms of Use</a
        >,
        <a
          class="underline decoration-[var(--line-2)] underline-offset-[3px] transition-colors duration-200 hover:text-[var(--ink)] hover:decoration-current"
          href="/privacy">Privacy Policy</a
        >
        and
        <a
          class="underline decoration-[var(--line-2)] underline-offset-[3px] transition-colors duration-200 hover:text-[var(--ink)] hover:decoration-current"
          href="/privacy">Cookies</a
        >
      </div>
      <div class="flex items-center gap-[22px] max-[980px]:flex-col max-[980px]:items-start">
        <span>&copy; {new Date().getFullYear()} ClassroomIO</span>
        <div class="flex gap-1.5">
          {#each FOOTER_SOCIAL_LINKS as social}
            <a
              class="grid h-[38px] w-[38px] place-items-center rounded-[10px] bg-[var(--panel)] text-[var(--ink)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--blue)] hover:text-white"
              href={social.href}
              aria-label={social.label}
              target="_blank"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
                <path d={social.path} />
              </svg>
            </a>
          {/each}
        </div>
      </div>
    </div>
  </div>
</footer>

<style>
  .ft-col {
    opacity: 0;
    transform: translateY(16px);
    transition:
      opacity 0.6s var(--ease) calc(var(--i) * 70ms),
      transform 0.7s var(--ease) calc(var(--i) * 70ms);
  }
  .ft-revealed .ft-col {
    opacity: 1;
    transform: none;
  }

  .ft-logo {
    opacity: 0;
    transform: scale(0.6) rotate(-20deg);
    transition:
      opacity 0.5s,
      transform 0.8s var(--spring);
  }
  .ft-revealed .ft-logo {
    opacity: 1;
    transform: none;
  }

  .ft-letter {
    transform: translateY(105%) translateY(var(--lift, 0));
    transition: transform 0.9s var(--ease) calc(var(--i) * 45ms);
  }
  .ft-revealed .ft-letter {
    transform: translateY(0) translateY(var(--lift, 0));
  }
  .ft-done .ft-wordmark {
    overflow: visible;
  }
  .ft-done .ft-letter {
    transition: transform 0.45s var(--spring);
  }

  @media (prefers-reduced-motion: reduce) {
    .ft-col,
    .ft-logo,
    .ft-letter {
      opacity: 1;
      transform: none;
      transition: none;
    }
  }
</style>
