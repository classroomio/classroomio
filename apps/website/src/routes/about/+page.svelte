<script lang="ts">
  import { onMount } from 'svelte';
  import PrototypeHead from '$lib/components/homepage/prototype-head.svelte';
  import FaqSection from '$lib/components/homepage/faq-section.svelte';
  import StoryCarousel from '$lib/components/homepage/story-carousel.svelte';
  import CtaSection from '$lib/components/homepage/cta-section.svelte';
  import { loadPrototypeScripts } from '$lib/utils/load-prototype-scripts';

  type TeamMember = {
    img: string;
    name: string;
    role: string;
    href: string;
    network: string;
    icon: 'x' | 'instagram' | 'linkedin';
  };

  const SOCIAL_ICONS: Record<TeamMember['icon'], string> = {
    x: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817-5.97 6.817H1.675l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z',
    instagram:
      'M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.64-.07-4.85s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16ZM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z',
    linkedin:
      'M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z'
  };

  const TEAM: TeamMember[] = [
    {
      img: '/home/images/team-1.jpg',
      name: 'Rotimi Best',
      role: 'Founder & CEO',
      href: 'https://x.com/rotimi_best',
      network: 'X',
      icon: 'x'
    },
    {
      img: '/home/images/team-8.jpg',
      name: 'Emmanuel Nwosu',
      role: 'Software Engineer',
      href: 'https://x.com/chifez4u',
      network: 'X',
      icon: 'x'
    },
    {
      img: '/home/images/team-6.jpg',
      name: 'Faith Rotimi',
      role: 'Growth Marketer',
      href: 'https://x.com/buksonly',
      network: 'X',
      icon: 'x'
    },
    {
      img: '/home/images/team-5.jpg',
      name: 'Hamzat Abdul-Muizz',
      role: 'Software Engineer',
      href: 'https://x.com/buildwithhamza_',
      network: 'X',
      icon: 'x'
    },
    {
      img: '/home/images/team-4.jpg',
      name: 'Winner Kagbo',
      role: 'Content Marketer',
      href: 'https://www.instagram.com/winnerkagbo',
      network: 'Instagram',
      icon: 'instagram'
    },
    {
      img: '/home/images/team-3.jpg',
      name: 'Victor Jack',
      role: 'Software Engineer',
      href: 'https://x.com/victorjack__',
      network: 'X',
      icon: 'x'
    },
    {
      img: '/home/images/team-7.jpg',
      name: 'Richard Kenneth',
      role: 'Software Engineer',
      href: 'https://www.linkedin.com/in/richardkennethdike',
      network: 'LinkedIn',
      icon: 'linkedin'
    },
    {
      img: '/home/images/team-2.jpg',
      name: 'Ellena Okpani',
      role: 'Product Manager',
      href: 'https://www.linkedin.com/in/ellena-okpani-b7a317337/',
      network: 'LinkedIn',
      icon: 'linkedin'
    }
  ];

  onMount(() => loadPrototypeScripts(['/home/about.js', '/home/stories.js', '/home/flow.js']));
</script>

<PrototypeHead
  title="About ClassroomIO"
  description="Why ClassroomIO exists: to end manual training and manual credentialing, so location and resources are never a barrier to high-quality education."
  stylesheets={['/home/about.css']}
/>

<main id="top" class="ab px-4 pt-3 max-sm:px-2 max-sm:pt-2">
  <section class="ph" id="ph" aria-labelledby="ab-title">
    <div class="ph-copy">
      <span class="ph-proof"
        ><span class="ph-faces" aria-hidden="true"
          ><img src="/home/images/team-1.jpg" alt="" /><img src="/home/images/team-3.jpg" alt="" /><img
            src="/home/images/team-5.jpg"
            alt=""
          /></span
        >Open source · cloud or self-hosted</span
      >
      <h1 class="ph-title" id="ab-title">
        <span class="ph-line"><span class="ph-in">Education anyone can take,</span></span><span class="ph-line ph-mark"
          ><span class="ph-in"
            >anywhere, anytime.<svg class="ph-swash" viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden="true"
              ><path pathLength="1" d="M4 19C70 7 180 2 296 13" /></svg
            ></span
          ></span
        >
      </h1>
      <p class="ph-lede">
        Where you live or what you can afford should never decide who gets a good education. With ClassroomIO, you build
        a course once and it teaches everyone, wherever they are and whenever they are ready to learn.
      </p>
      <div class="ph-cta">
        <a class="btn btn-blue btn-lg" href="https://classroomio.com/signup">Start for free</a>
        <a class="btn btn-line btn-lg" href="https://classroomio.com/changelog">See what&rsquo;s new</a>
      </div>
    </div>

    <div class="ph-banner">
      <svg class="ph-curve" viewBox="0 0 1400 600" preserveAspectRatio="none" aria-hidden="true"
        ><path pathLength="1" d="M-10 470C180 610 420 600 620 420S1080 40 1410 150" /></svg
      >
      <div class="ph-photos">
        <img class="on" src="/home/images/hero-retreat.jpg" alt="" aria-hidden="true" />
        <img src="/home/images/hero-rotimi-v2.webp" alt="" aria-hidden="true" />
        <img src="/home/images/hero-team-room.jpg?v=3" alt="" aria-hidden="true" />
        <span class="ph-shade" aria-hidden="true"></span>
        <div class="ph-meter" aria-hidden="true"><span class="ph-now">01</span><i><b></b></i><span>03</span></div>
        <div class="ph-ask" aria-hidden="true">
          <svg viewBox="0 0 16 16"><circle cx="7" cy="7" r="4.5" /><path d="m10.5 10.5 3 3" /></svg><span
            class="ph-typed"
          ></span><i class="ph-caret"></i><span class="ph-send"
            ><svg viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4" /></svg></span
          >
        </div>
        <div class="ph-tabs" aria-label="Hero photos">
          <button
            class="ph-tab on"
            type="button"
            aria-pressed="true"
            data-ask="Create an onboarding course for new customers"
            ><span class="ph-k">Photo 1 of 3</span><i></i></button
          >
          <button
            class="ph-tab"
            type="button"
            aria-pressed="false"
            data-ask="Turn this help doc into a five-lesson course"
            ><span class="ph-k">Photo 2 of 3</span><i></i></button
          >
          <button class="ph-tab" type="button" aria-pressed="false" data-ask="Translate this course into Spanish"
            ><span class="ph-k">Photo 3 of 3</span><i></i></button
          >
        </div>
      </div>

      <div class="ph-float ph-float-l" aria-hidden="true">
        <div class="ph-fc on" data-slide="0">
          <span class="ph-ic"
            ><svg viewBox="0 0 24 24"
              ><circle cx="12" cy="12" r="9" /><path
                d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3Z"
              /></svg
            ></span
          ><b>Learn from anywhere</b>
          <p>Courses, quizzes and certificates on any device, in any timezone.</p>
        </div>
        <div class="ph-fc" data-slide="1">
          <span class="ph-ic"
            ><svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="5" /><path d="m9 13.5-1.5 7L12 18l4.5 2.5-1.5-7" /></svg
            ></span
          ><b>Certify automatically</b>
          <p>Everyone who finishes gets a certificate. Nobody issues it by hand.</p>
        </div>
        <div class="ph-fc" data-slide="2">
          <span class="ph-ic"
            ><svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h10M4 17h7" /><path d="m15 17 2 2 4-4" /></svg></span
          ><b>Built with customers</b>
          <p>We ship every week, shaped by the teams teaching on ClassroomIO.</p>
        </div>
      </div>

      <div class="ph-float ph-float-r" aria-hidden="true">
        <div class="ph-fc on" data-slide="0">
          <span class="ph-eyebrow">Course</span><b>Customer onboarding</b><span class="ph-meta">6 lessons · 30 min</span
          ><span class="ph-row"
            ><span class="ph-chip">Video</span><span class="ph-chip">Quiz</span><span class="ph-chip">+4</span></span
          >
        </div>
        <div class="ph-fc" data-slide="1">
          <span class="ph-eyebrow">Certificate issued</span><b>Product basics</b><span class="ph-meta"
            >Completed · score 92%</span
          ><span class="ph-bar"><i style="--w:92%"></i></span>
        </div>
        <div class="ph-fc" data-slide="2">
          <span class="ph-eyebrow">This week</span><b>What&rsquo;s new</b><span class="ph-list"
            ><span>Academy analytics</span><span>Bulk media uploads</span><span>Floating Assistant</span></span
          >
        </div>
      </div>
    </div>
  </section>

  <section class="ab-logos-sec" aria-label="Teams teaching with ClassroomIO">
    <div class="ah-logos py-[44px] pb-9 text-center">
      <p class="mb-6 font-mono text-[11.5px] tracking-[0.08em] text-[--muted] uppercase">
        Teams teaching with ClassroomIO
      </p>
      <div class="marq">
        <div class="marq-track" style="animation-duration: 28s;">
          <ul class="marq-list">
            <li><img src="https://energis.cloud/wp-content/uploads/Energis-logo-new-color.svg" alt="Energis" /></li>
            <li><img class="mono" src="/home/images/sensorhubb-logo.png" alt="SensorHubb" /></li>
            <li><img src="https://okayo.fr/logo-sombre.png" alt="Okayo" /></li>
            <li>
              <img
                src="https://quickeasy.business/wp-content/uploads/elementor/thumbs/QEBS-Logo-scaled-rpo4xlet0k5vfquff4ut3hpo08ojhrufsyof1wjofc.png"
                alt="QuickEasy Business Systems"
              />
            </li>
            <li><img src="https://energis.cloud/wp-content/uploads/Energis-logo-new-color.svg" alt="" /></li>
            <li><img class="mono" src="/home/images/sensorhubb-logo.png" alt="" /></li>
            <li><img src="https://okayo.fr/logo-sombre.png" alt="" /></li>
            <li>
              <img
                src="https://quickeasy.business/wp-content/uploads/elementor/thumbs/QEBS-Logo-scaled-rpo4xlet0k5vfquff4ut3hpo08ojhrufsyof1wjofc.png"
                alt=""
              />
            </li>
          </ul>
          <ul class="marq-list" aria-hidden="true">
            <li><img src="https://energis.cloud/wp-content/uploads/Energis-logo-new-color.svg" alt="" /></li>
            <li><img class="mono" src="/home/images/sensorhubb-logo.png" alt="" /></li>
            <li><img src="https://okayo.fr/logo-sombre.png" alt="" /></li>
            <li>
              <img
                src="https://quickeasy.business/wp-content/uploads/elementor/thumbs/QEBS-Logo-scaled-rpo4xlet0k5vfquff4ut3hpo08ojhrufsyof1wjofc.png"
                alt=""
              />
            </li>
            <li><img src="https://energis.cloud/wp-content/uploads/Energis-logo-new-color.svg" alt="" /></li>
            <li><img class="mono" src="/home/images/sensorhubb-logo.png" alt="" /></li>
            <li><img src="https://okayo.fr/logo-sombre.png" alt="" /></li>
            <li>
              <img
                src="https://quickeasy.business/wp-content/uploads/elementor/thumbs/QEBS-Logo-scaled-rpo4xlet0k5vfquff4ut3hpo08ojhrufsyof1wjofc.png"
                alt=""
              />
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <section
    class="mx-auto mb-3 max-w-[var(--max)] rounded-[var(--radius)] px-14 py-[88px] max-[960px]:px-7 max-[960px]:py-16 max-sm:px-4 max-sm:py-14"
    id="mission"
    aria-labelledby="mv-title"
  >
    <div class="mv-head mb-12 text-center">
      <h2 class="h2 mx-auto" id="mv-title" data-split>Our mission <span class="tone">and vision.</span></h2>
      <p class="sub mx-auto mt-4 max-w-[52ch] text-[16.5px] text-[--muted]" data-in>
        Good education still depends on where you are and what you can afford, because it depends on a person delivering
        it every time. We think that can change.
      </p>
    </div>
    <div class="bn" id="bento">
      <article class="bn-card bn-mission" data-in style="--d:0s">
        <span class="bn-media"
          ><img
            src="/home/images/team-mission.jpg"
            alt="Two ClassroomIO team members listening during a team session"
          /></span
        >
        <span class="bn-site">classroomio.com</span>
        <div class="bn-foot">
          <span class="bn-label">Our mission</span>
          <p class="bn-say" data-split>End manual training and manual credentialing.</p>
        </div>
      </article>

      <article class="bn-card bn-vision" data-in style="--d:.1s">
        <span class="bn-media bn-duo"
          ><img
            src="/home/images/team-vision-smile.jpg"
            alt="A ClassroomIO team member laughing at his laptop during a team session"
          /></span
        >
        <span class="bn-media bn-lens" aria-hidden="true"><img src="/home/images/team-vision-smile.jpg" alt="" /></span>
        <span class="bn-label bn-label-top">Our vision</span>
        <div class="bn-prompt" aria-hidden="true">
          <div class="bn-ask">
            <i class="bn-spark"><img src="/home/images/logo.svg" alt="" /></i>
            <span
              ><small>I want to</small><b
                ><span id="bn-typed">Teach customers our product</span><em class="bn-caret"></em></b
              ></span
            >
          </div>
          <ul class="bn-opts" id="bn-opts">
            <li>Teach customers our product</li>
            <li>Train our partners</li>
            <li>Onboard new employees</li>
            <li>Launch a branded academy</li>
          </ul>
        </div>
        <p class="bn-say bn-say-sm" data-split>
          Every school, university and company in the world teaches on ClassroomIO.
        </p>
      </article>

      <a class="bn-card bn-open" href="https://classroomio.com/developers" data-in style="--d:.2s">
        <span class="bn-site">Agent friendly</span>
        <svg class="bn-graph" viewBox="0 0 160 60" aria-hidden="true"
          ><path d="M4 44H156M40 44C56 44 56 16 72 16H120C136 16 136 44 152 44" /><circle cx="4" cy="44" r="4" /><circle
            cx="40"
            cy="44"
            r="4"
          /><circle cx="72" cy="16" r="4" /><circle cx="104" cy="16" r="4" /><circle cx="104" cy="44" r="4" /><circle
            cx="152"
            cy="44"
            r="5"
          /></svg
        >
        <b class="bn-big" id="bn-big" aria-label="MCP">MCP</b>
        <p>Create, publish and report on courses from Claude, Cursor or any MCP client.</p>
        <span class="bn-go"
          ><span class="sr">See the developer docs</span><svg viewBox="0 0 16 16" aria-hidden="true"
            ><path
              d="M3 8h10M9 4l4 4-4 4"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            /></svg
          ></span
        >
      </a>

      <article class="bn-card bn-mark" data-in style="--d:.3s">
        <svg class="bn-scribble" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <path
            pathLength="1"
            d="M-20 60C60-10 120 120 70 150S-10 120 40 80 200 20 230 110 160 220 140 170 260 60 330 120 300 260 260 220 360 140 430 190"
          />
          <path
            pathLength="1"
            d="M-30 235C40 160 110 300 60 290S20 210 100 200 220 300 240 240 180 160 230 150 360 260 340 290 300 200 430 215"
          />
          <path
            pathLength="1"
            d="M120-20C100 60 200 40 180 90S100 110 130 70 280-10 300 60 240 120 270 90 400 40 420 80"
          />
        </svg>
        <span class="bn-logo"><img src="/home/images/logo.svg" alt="" />ClassroomIO</span>
      </article>
    </div>
  </section>

  <section
    class="mx-auto max-w-[var(--max)] px-14 pt-[104px] max-[960px]:px-7 max-[960px]:pt-20 max-sm:px-2 max-sm:pt-16"
    id="who-we-are"
    aria-labelledby="who-title"
  >
    <div class="wwa" id="wwa" data-in>
      <i class="wwa-glow" aria-hidden="true"></i>
      <div class="wwa-grid" aria-hidden="true">
        <i class="wwa-c wwa-ic a" data-ic="play"
          ><svg viewBox="0 0 24 24"
            ><circle cx="12" cy="12" r="9" /><path class="wwa-anim" d="M10 8.5v7l5.5-3.5z" /></svg
          ><small>Video lessons</small></i
        ><i class="wwa-c wwa-p" data-k="0"><img src="/home/images/team-founder.jpg" alt="" /></i><span
          class="wwa-pill"
          data-k="0"
          ><b>B2B</b><i class="wwa-arrow"><svg viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4" /></svg></i></span
        >
        <i class="wwa-c wwa-ic" data-ic="book"
          ><svg viewBox="0 0 24 24"
            ><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5z" /><path
              d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5z"
            /><path class="wwa-anim" d="M13 4h5.5A1.5 1.5 0 0 1 20 5.5V19" /></svg
          ><small>Courses</small></i
        ><i class="wwa-c wwa-ic a" data-ic="award"
          ><svg viewBox="0 0 24 24"
            ><circle cx="12" cy="9" r="5.5" /><path d="M8.5 13.5 7 21l5-2.5 5 2.5-1.5-7.5" /><path
              class="wwa-anim"
              d="m10 9 1.5 1.5L14.5 7.5"
            /></svg
          ><small>Certificates</small></i
        ><i class="wwa-c wwa-ic" data-ic="chart"
          ><svg viewBox="0 0 24 24"
            ><path d="M4 20h16" /><path class="wwa-bar1" d="M7 17v-5" /><path class="wwa-bar2" d="M12 17V7" /><path
              class="wwa-bar3"
              d="M17 17v-8"
            /></svg
          ><small>Analytics</small></i
        ><i class="wwa-c wwa-ic" data-ic="spark"
          ><svg viewBox="0 0 24 24"
            ><path class="wwa-anim" d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path
              d="M19 15.5l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6z"
            /></svg
          ><small>AI Tutor</small></i
        >
        <i class="wwa-c wwa-p" data-k="1"><img src="/home/images/team-laptops.jpg" alt="" /></i><span
          class="wwa-pill"
          data-k="1"
          ><b>Customer education</b><i class="wwa-arrow"
            ><svg viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4" /></svg></i
          ></span
        ><i class="wwa-c wwa-ic" data-ic="globe"
          ><svg viewBox="0 0 24 24"
            ><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path
              class="wwa-anim"
              d="M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z"
            /></svg
          ><small>Your domain</small></i
        >
        <i class="wwa-c wwa-ic" data-ic="chat"
          ><svg viewBox="0 0 24 24"
            ><path
              d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5z"
            /><circle class="wwa-dot1" cx="8.5" cy="10" r="1" /><circle class="wwa-dot2" cx="12" cy="10" r="1" /><circle
              class="wwa-dot3"
              cx="15.5"
              cy="10"
              r="1"
            /></svg
          ><small>Community</small></i
        ><i class="wwa-c wwa-p" data-k="2"><img src="/home/images/analytics.jpg" alt="" /></i><span
          class="wwa-pill"
          data-k="2"
          ><b>Business growth</b><i class="wwa-arrow"><svg viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4" /></svg></i
          ></span
        >
      </div>
      <div class="wwa-txt">
        <span class="wwa-eyebrow"><i></i>About ClassroomIO</span>
        <h2 class="h2" id="who-title" data-split>Who we are</h2>
        <p class="wwa-lead">
          ClassroomIO is a B2B customer education platform that helps companies use education to grow their business.
        </p>
        <p class="wwa-more">
          We build open-source software that turns what your team knows into courses, academies and learning paths your
          customers actually finish, so they adopt faster, need less support and stay longer.
        </p>
        <ul class="wwa-list">
          <li>
            <button class="wwa-row on" type="button" data-k="0" aria-expanded="true"
              ><span class="wwa-num">01</span><span class="wwa-body"
                ><b>Built for companies</b><span class="wwa-desc"
                  ><span
                    >Teams, roles, cohorts and a branded academy on your own domain, not a classroom tool stretched to
                    fit.</span
                  ></span
                ></span
              ><i class="wwa-bar"></i></button
            >
          </li>
          <li>
            <button class="wwa-row" type="button" data-k="1" aria-expanded="false"
              ><span class="wwa-num">02</span><span class="wwa-body"
                ><b>Teach customers your product</b><span class="wwa-desc"
                  ><span
                    >Onboard, train and certify customers so they reach value faster and open fewer support tickets.</span
                  ></span
                ></span
              ><i class="wwa-bar"></i></button
            >
          </li>
          <li>
            <button
              class="wwa-row align-start color-[inherit] relative flex cursor-pointer gap-[18px] border-none bg-none py-[16px] text-left font-[inherit] outline-none"
              type="button"
              data-k="2"
              aria-expanded="false"
              ><span class="wwa-num">03</span><span class="wwa-body"
                ><b>Tie learning to growth</b><span class="wwa-desc"
                  ><span>See who learns, who is stuck and who finishes, and connect it to retention and expansion.</span
                  ></span
                ></span
              ><i class="wwa-bar"></i></button
            >
          </li>
        </ul>
        <dl class="wwa-facts">
          <div>
            <dt>Open source</dt>
            <dd>Code you can read</dd>
          </div>
          <div>
            <dt>Cloud or self-hosted</dt>
            <dd>Run it your way</dd>
          </div>
          <div>
            <dt>AI built in</dt>
            <dd>Drafts and tutoring</dd>
          </div>
        </dl>
      </div>
    </div>
  </section>

  <section
    class="mx-auto grid max-w-[var(--max)] grid-cols-[220px_1fr] gap-8 px-14 pt-[104px] max-[960px]:grid-cols-1 max-[960px]:gap-4 max-[960px]:px-7 max-[960px]:pt-20 max-sm:px-2 max-sm:pt-16"
    id="our-story"
    aria-labelledby="intro-title"
  >
    <span class="mt-2.5 mb-0 inline-flex items-center gap-2 self-start text-sm text-[--muted] max-[960px]:mt-0"
      ><i class="inline-block h-[7px] w-[7px] rounded-full bg-[var(--ink)]"></i>Our story</span
    >
    <div>
      <h2 class="h2 text-[clamp(30px,3.4vw,44px)] text-[#0b1233]" id="intro-title" data-split>Our story</h2>
      <p
        class="mt-0 max-w-[34ch] text-[clamp(22px,2.3vw,30px)] leading-[1.3] font-medium tracking-[-0.025em] text-[#0b1233]"
        data-in
      >
        Education should work like software engineering: from anywhere, and still successful.
      </p>
      <div class="mt-6 grid max-w-[62ch] gap-3.5" data-in>
        <p class="m-0 text-base leading-[1.6] text-[--muted]">
          In 2020, everyone was confused. Schools, teachers and companies had to teach without a room, and almost nobody
          was ready.
        </p>
        <p class="m-0 text-base leading-[1.6] text-[--muted]">
          Most training still needs a person, in a room or on a call, every time. That ties good education to where you
          are and what you can afford.
        </p>
        <p class="m-0 text-base leading-[1.6] text-[--muted]">
          We&rsquo;re building the tools that let anyone take any form of education, anywhere, anytime. <b
            class="font-medium text-[#0b1233]"
            >We want to be to education what WordPress became to publishing: the platform anyone can build their
            teaching on.</b
          >
        </p>
      </div>
      <ul class="mt-12 grid list-none grid-cols-3 border-t border-[--line] p-0 max-[960px]:grid-cols-1" data-in>
        <li class="grid gap-1.5 pt-[22px] pr-5 max-[960px]:pb-5 max-sm:pr-3">
          <b class="text-[clamp(24px,2.4vw,32px)] leading-[1.1] font-medium tracking-[-0.03em] text-[#0542cc]">Today</b
          ><span class="text-[13.5px] text-[--muted]">Companies training their customers</span>
        </li>
        <li
          class="grid gap-1.5 border-l border-[--line] pt-[22px] pr-5 pl-5 max-[960px]:border-l-0 max-[960px]:pb-5 max-[960px]:pl-0 max-sm:pr-3"
        >
          <b class="text-[clamp(24px,2.4vw,32px)] leading-[1.1] font-medium tracking-[-0.03em] text-[#0542cc]">Next</b
          ><span class="text-[13.5px] text-[--muted]">Schools and universities</span>
        </li>
        <li
          class="grid gap-1.5 border-l border-[--line] pt-[22px] pr-5 pl-5 max-[960px]:border-l-0 max-[960px]:pb-5 max-[960px]:pl-0 max-sm:pr-3"
        >
          <b class="text-[clamp(24px,2.4vw,32px)] leading-[1.1] font-medium tracking-[-0.03em] text-[#0542cc]"
            >In 10 years</b
          ><span class="text-[13.5px] text-[--muted]">Every school, university and company in the world</span>
        </li>
      </ul>
    </div>
  </section>

  <section
    class="mx-auto max-w-[var(--max)] px-14 pt-[104px] max-[960px]:px-7 max-[960px]:pt-20 max-sm:px-2 max-sm:pt-16"
    id="what-we-do"
    aria-labelledby="does-title"
  >
    <div class="ab-head mb-12 text-center max-sm:mb-8">
      <h2 class="h2 ab-h mx-auto text-[clamp(30px,3.4vw,44px)] text-[#0b1233]" id="does-title" data-split>
        What value does ClassroomIO provide?
      </h2>
      <p class="sub mx-auto mt-4 max-w-[52ch] text-[16.5px] text-[--muted]" data-in>
        Education can play a role at every stage of the customer journey. It can help attract and educate potential
        customers, support the sales process, get new customers to value faster, help customers understand more of the
        product, and keep customers engaged over time.
      </p>
    </div>
    <div class="vx" id="vx" data-in>
      <article class="vx-card vx-dark vx-create" style="--n:0">
        <i class="vx-glare" aria-hidden="true"></i>
        <span class="vx-dots" aria-hidden="true"></span>
        <header class="vx-bar">
          <span class="vx-mark"
            ><svg viewBox="0 0 33 24" aria-hidden="true"
              ><path
                d="M26.15 12.57a6.09 6.09 0 1 0 0-12.17 6.09 6.09 0 0 0 0 12.17ZM32.3 14.98v8.83H18.93V20.6c0-3.08 2.47-5.62 5.62-5.62h7.75ZM16.72.4v23.41H11.7c-3.21 0-6.15-1.34-8.29-3.41A11.7 11.7 0 0 1 11.7.4h5.02Z"
              /></svg
            ></span
          ><span class="vx-url">learn.yourcompany.com</span>
        </header>
        <h3 class="vx-title">
          <span class="vx-w">Turn</span> <span class="vx-w">what</span> <span class="vx-w">you</span>
          <span class="vx-w">know</span> <span class="vx-w vx-hi">into</span> <span class="vx-w vx-hi">courses</span>
          <span class="vx-w vx-hi">people</span> <span class="vx-w vx-hi">finish</span>
        </h3>
        <span class="vx-orb" aria-hidden="true">
          <i class="vx-ring"></i><i class="vx-ring vx-ring-2"></i>
          <svg class="vx-logo3d" viewBox="0 0 33 24"
            ><defs
              ><linearGradient id="vx-g" x1="0" y1="0" x2="1" y2="1"
                ><stop offset="0" stop-color="#fff" /><stop offset=".55" stop-color="#f3f6ff" /><stop
                  offset="1"
                  stop-color="#cdd9f7"
                /></linearGradient
              ><linearGradient id="vx-gs" x1="0" y1="0" x2="0" y2="1"
                ><stop offset="0" stop-color="#fff" stop-opacity=".75" /><stop
                  offset=".5"
                  stop-color="#fff"
                  stop-opacity="0"
                /></linearGradient
              ></defs
            ><path
              fill="url(#vx-g)"
              d="M26.15 12.57a6.09 6.09 0 1 0 0-12.17 6.09 6.09 0 0 0 0 12.17ZM32.3 14.98v8.83H18.93V20.6c0-3.08 2.47-5.62 5.62-5.62h7.75ZM16.72.4v23.41H11.7c-3.21 0-6.15-1.34-8.29-3.41A11.7 11.7 0 0 1 11.7.4h5.02Z"
            /><path
              fill="url(#vx-gs)"
              d="M26.15 12.57a6.09 6.09 0 1 0 0-12.17 6.09 6.09 0 0 0 0 12.17ZM32.3 14.98v8.83H18.93V20.6c0-3.08 2.47-5.62 5.62-5.62h7.75ZM16.72.4v23.41H11.7c-3.21 0-6.15-1.34-8.29-3.41A11.7 11.7 0 0 1 11.7.4h5.02Z"
            /></svg
          >
        </span>
        <a class="vx-cta" href="https://classroomio.com/signup"
          ><span><small>ClassroomIO for teams</small><b>Start for free</b></span><i class="vx-go"
            ><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" /></svg><svg
              viewBox="0 0 16 16"
              aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" /></svg
            ></i
          ></a
        >
      </article>

      <article class="vx-card vx-light vx-ask" style="--n:1">
        <i class="vx-glare" aria-hidden="true"></i>
        <header class="vx-bar">
          <span class="vx-mark vx-mark-solid"
            ><svg viewBox="0 0 33 24" aria-hidden="true"
              ><path
                d="M26.15 12.57a6.09 6.09 0 1 0 0-12.17 6.09 6.09 0 0 0 0 12.17ZM32.3 14.98v8.83H18.93V20.6c0-3.08 2.47-5.62 5.62-5.62h7.75ZM16.72.4v23.41H11.7c-3.21 0-6.15-1.34-8.29-3.41A11.7 11.7 0 0 1 11.7.4h5.02Z"
              /></svg
            ></span
          ><span class="vx-url">classroomio.com</span>
        </header>
        <figure class="vx-photo">
          <img
            src="/home/images/team-value-2.jpg"
            alt="A ClassroomIO team member explaining a point during a team meeting"
          />
        </figure>
        <div class="vx-prompt">
          <i class="vx-spark" aria-hidden="true"
            ><svg viewBox="0 0 24 24"
              ><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path
                d="M19 15l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6z"
              /></svg
            ></i
          >
          <span class="vx-q"
            ><small>Ask AI Tutor</small><b
              ><span class="vx-typed">Summarise lesson 3 in two lines</span><i class="vx-caret" aria-hidden="true"
              ></i></b
            ></span
          >
          <span class="vx-reply" aria-hidden="true"><i></i><span>3 key points ready</span></span>
          <button class="vx-send" type="button" aria-label="Send prompt"
            ><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13V3M4 7l4-4 4 4" /></svg></button
          >
        </div>
        <p class="vx-copy"><span>Ask ClassroomIO anything —</span> answers straight from your course.</p>
      </article>

      <article class="vx-card vx-dark vx-stats" style="--n:2">
        <i class="vx-glare" aria-hidden="true"></i>
        <svg class="vx-giant" viewBox="0 0 33 24" aria-hidden="true"
          ><path
            d="M26.15 12.57a6.09 6.09 0 1 0 0-12.17 6.09 6.09 0 0 0 0 12.17ZM32.3 14.98v8.83H18.93V20.6c0-3.08 2.47-5.62 5.62-5.62h7.75ZM16.72.4v23.41H11.7c-3.21 0-6.15-1.34-8.29-3.41A11.7 11.7 0 0 1 11.7.4h5.02Z"
          /></svg
        >
        <header class="vx-bar">
          <span class="vx-mark"
            ><svg viewBox="0 0 33 24" aria-hidden="true"
              ><path
                d="M26.15 12.57a6.09 6.09 0 1 0 0-12.17 6.09 6.09 0 0 0 0 12.17ZM32.3 14.98v8.83H18.93V20.6c0-3.08 2.47-5.62 5.62-5.62h7.75ZM16.72.4v23.41H11.7c-3.21 0-6.15-1.34-8.29-3.41A11.7 11.7 0 0 1 11.7.4h5.02Z"
              /></svg
            ></span
          ><span class="vx-url">Analytics</span>
        </header>
        <div class="vx-stat" aria-live="polite">
          <button class="vx-arrow" type="button" data-step="-1" aria-label="Previous metric"
            ><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" /></svg></button
          >
          <span class="vx-metric"><small class="vx-label">Course completion</small><b class="vx-val">68%</b></span>
          <button class="vx-arrow" type="button" data-step="1" aria-label="Next metric"
            ><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 10l4-4 4 4" /></svg></button
          >
        </div>
        <span class="vx-word" aria-label="ClassroomIO"
          ><i>C</i><i>l</i><i>a</i><i>s</i><i>s</i><i>r</i><i>o</i><i>o</i><i>m</i><i>I</i><i>O</i></span
        >
      </article>
    </div>
  </section>

  <section
    class="mx-auto mb-3 max-w-[var(--max)] overflow-hidden rounded-[var(--radius)] border border-[--line] bg-white py-24 pb-[104px] max-[960px]:px-7 max-[960px]:py-16 max-sm:px-0 max-sm:py-16 max-sm:pb-[72px]"
    id="team"
    aria-labelledby="team-title"
  >
    <div
      class="flex items-end justify-between gap-6 px-14 max-[960px]:px-7 max-sm:flex-col max-sm:items-start max-sm:px-4"
    >
      <div>
        <span class="mb-4 inline-flex items-center gap-2 text-sm text-[--muted]"
          ><i class="inline-block h-[7px] w-[7px] rounded-full bg-[var(--ink)]"></i>Our team</span
        >
        <h2 class="h2" id="team-title" data-split>Meet the ClassroomIO team</h2>
        <p class="sub mt-4 max-w-[46ch] text-base text-[--muted]" data-in>The people working to end manual training.</p>
      </div>
    </div>
    <div
      class="grid grid-cols-1 gap-4 overflow-visible px-14 pt-12 max-[1100px]:px-7 max-[860px]:gap-3 max-[860px]:px-4 max-[860px]:pt-8 max-sm:px-4 max-sm:pt-8 md:grid-cols-2 lg:grid-cols-4"
      id="team-track"
      data-in
    >
      {#each TEAM as member (member.name)}
        <article class="ab-card relative aspect-[4/5] overflow-hidden rounded-[var(--radius)] bg-[--blue-t]">
          <img
            class="h-full w-full object-cover object-[center_30%] transition-transform duration-[0.8s] ease-[var(--ease)] hover:scale-105"
            src={member.img}
            alt={`${member.name}, ${member.role}`}
            loading="lazy"
          />
          <div
            class="ab-tag absolute right-3 bottom-3 left-3 flex items-center justify-between gap-3 rounded-lg bg-white p-3 px-3.5 max-[480px]:right-2 max-[480px]:bottom-2 max-[480px]:left-2 max-[480px]:p-2.5"
          >
            <div>
              <b class="text-[15px] font-medium tracking-[-0.01em]">{member.name}</b><span
                class="mt-0.5 text-[13px] text-[--muted]">{member.role}</span
              >
            </div>
            <a
              class="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full border border-[--line] transition-colors hover:border-[--blue] hover:bg-[--blue] hover:text-white max-[480px]:hidden"
              href={member.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${member.name} on ${member.network}`}
              ><svg class="h-[13px] w-[13px]" viewBox="0 0 24 24" aria-hidden="true"
                ><path fill="currentColor" d={SOCIAL_ICONS[member.icon]} /></svg
              ></a
            >
          </div>
        </article>
      {/each}
    </div>
  </section>

  <section
    class="mx-auto max-w-[var(--max)] px-14 pt-[104px] max-[960px]:px-7 max-[960px]:pt-20 max-sm:px-2 max-sm:pt-16"
    id="different"
    aria-labelledby="diff-title"
  >
    <div class="ab-head mb-12 text-center max-sm:mb-8">
      <span
        class="ab-pill mb-[18px] inline-flex h-[26px] items-center rounded-full border border-[--line-2] bg-white px-[11px] text-[12.5px] font-medium text-[--muted]"
        data-in>Why ClassroomIO</span
      >
      <h2 class="h2 ab-h mx-auto text-[clamp(30px,3.4vw,44px)] text-[#0b1233]" id="diff-title" data-split>
        What makes ClassroomIO different
      </h2>
    </div>
    <div class="df grid grid-cols-3 gap-3 max-[960px]:grid-cols-2 max-sm:grid-cols-1">
      <a
        class="ab-c df-card df-open relative col-span-2 flex min-h-[400px] flex-col justify-between overflow-hidden rounded-[var(--radius)] bg-[#0b1233] p-6 text-white max-[960px]:col-span-full max-sm:min-h-[380px]"
        href="/#bx-academy"
        data-in
        style="--d:0s"
      >
        <img
          class="absolute inset-0 h-full w-full object-cover object-[center_36%]"
          src="/home/images/team-customisable.jpg"
          alt="Two ClassroomIO team members listening in a meeting"
        />
        <span class="relative z-[2] mb-5 flex items-center justify-between">
          <span
            class="inline-flex h-[26px] items-center rounded-full border border-white/[0.22] bg-white/[0.14] px-[11px] text-[12.5px] font-medium text-white"
            >Customisable</span
          >
          <span class="ab-go grid h-[30px] w-[30px] place-items-center rounded-full bg-white text-[#0b1233]"
            ><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" aria-hidden="true"
              ><path
                d="M3 8h10M9 4l4 4-4 4"
                fill="none"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
              /></svg
            ></span
          >
        </span>
        <span class="df-foot relative z-[2] max-w-[520px]">
          <h3 class="m-0 text-[22px] leading-[1.25] font-medium tracking-[-0.02em] text-white">
            It looks like you, not like us
          </h3>
          <p class="mt-2.5 text-[14.5px] leading-[1.55] text-white/[0.82]">
            Your domain, your logo, your colours and your certificates. Embed courses in your site or product.
          </p>
        </span>
      </a>
      <a
        class="ab-c df-card df-blue relative flex min-h-[400px] flex-col overflow-hidden rounded-[var(--radius)] bg-[--blue] p-6 text-white max-sm:min-h-0"
        href="/pricing"
        data-in
        style="--d:.08s"
      >
        <span class="relative z-[2] mb-5 flex items-center justify-between">
          <span
            class="inline-flex h-[26px] items-center rounded-full border border-white/[0.22] bg-white/[0.14] px-[11px] text-[12.5px] font-medium text-white"
            >Free to start</span
          >
          <span class="ab-go grid h-[30px] w-[30px] place-items-center rounded-full bg-white text-[#0b1233]"
            ><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" aria-hidden="true"
              ><path
                d="M3 8h10M9 4l4 4-4 4"
                fill="none"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
              /></svg
            ></span
          >
        </span>
        <h3 class="m-0 text-[18px] leading-[1.25] font-medium tracking-[-0.02em] text-white">
          Start free, stay in control
        </h3>
        <p class="mt-2.5 mb-6 text-[14.5px] leading-[1.55] text-white/80">
          There is a free plan, and the code is open source, so you are never locked in. Paid plans start at $39 a
          month.
        </p>
        <span class="df-pic df-group relative mt-auto h-[200px] overflow-hidden rounded-[var(--radius)]"
          ><img
            class="absolute inset-0 h-full w-full scale-[1.14] object-cover object-[60%_35%]"
            src="/home/images/team-group.jpg?v=2"
            alt="Five members of the ClassroomIO team standing together with arms crossed"
          /></span
        >
      </a>
      <article
        class="ab-c df-card relative flex min-h-[400px] flex-col overflow-hidden rounded-[var(--radius)] bg-[--panel] p-6 text-[#0b1233] max-sm:min-h-0"
        data-in
        style="--d:.16s"
      >
        <span class="relative z-[2] mb-5 flex items-center justify-between">
          <span
            class="inline-flex h-[26px] items-center rounded-full border border-[--line-2] bg-white px-[11px] text-[12.5px] font-medium text-[--muted]"
            >Developer friendly</span
          >
        </span>
        <h3 class="m-0 text-[18px] leading-[1.25] font-medium tracking-[-0.02em]">A real API, not a checkbox</h3>
        <p class="mt-2.5 mb-6 text-[14.5px] leading-[1.55] text-[--muted]">
          A public API, signed webhooks and Zapier, so completions and certificates land in your CRM and support desk.
        </p>
        <span
          class="df-pic df-dev relative mt-auto min-h-[210px] flex-1 overflow-hidden rounded-[var(--radius)] bg-[#4f86ff] max-sm:min-h-[240px]"
          ><img
            class="absolute inset-0 h-full w-full object-cover object-[60%_35%] mix-blend-multiply brightness-[1.2] contrast-[1.1] grayscale"
            src="/home/images/team-laptop-talk.jpg"
            alt="A ClassroomIO team member explaining something to colleagues across a meeting table"
          /><span class="df-stack absolute right-2.5 bottom-2.5 left-2.5 z-[2] flex flex-wrap gap-1.5"
            ><i
              class="rounded-[10px] bg-[#0542cc] px-2.5 py-[7px] text-[12.5px] leading-none font-medium text-white not-italic"
              >API</i
            ><i
              class="rounded-[10px] bg-white px-2.5 py-[7px] text-[12.5px] leading-none font-medium text-[#0b1233] not-italic"
              >Webhooks</i
            ><i
              class="rounded-[10px] bg-white px-2.5 py-[7px] text-[12.5px] leading-none font-medium text-[#0b1233] not-italic"
              >Zapier</i
            ></span
          ></span
        >
      </article>
      <article
        class="ab-c df-card relative flex min-h-[400px] flex-col overflow-hidden rounded-[var(--radius)] bg-[--panel] p-6 text-[#0b1233] max-sm:min-h-0"
        data-in
        style="--d:.24s"
      >
        <span class="relative z-[2] mb-5 flex items-center justify-between">
          <span
            class="inline-flex h-[26px] items-center rounded-full border border-[--line-2] bg-white px-[11px] text-[12.5px] font-medium text-[--muted]"
            >Focus</span
          >
        </span>
        <h3 class="m-0 text-[18px] leading-[1.25] font-medium tracking-[-0.02em]">Built to end manual training</h3>
        <p class="mt-2.5 mb-6 text-[14.5px] leading-[1.55] text-[--muted]">
          Set the training up once, put every new customer through it, and certify them. Your experts only show up for
          the parts that need them.
        </p>
        <span class="df-pic tl relative mt-auto h-[140px] overflow-hidden rounded-[var(--radius)]" aria-hidden="true">
          <span class="tl-rail">
            <span class="tl-col"
              ><span class="tl-run">
                <span class="tl-tile tl-blue tl-a"
                  ><i></i><i></i><i></i><b>Set it up once.</b><small>ClassroomIO / customer training</small></span
                >
                <span class="tl-tile tl-mint tl-b"
                  ><i></i><i></i><i></i><b>Certify every customer.</b><small>ClassroomIO / customer training</small
                  ></span
                >
                <span class="tl-tile tl-navy tl-c"
                  ><i></i><i></i><i></i><b>Less hand-holding.</b><small>ClassroomIO / customer training</small></span
                >
              </span></span
            >
            <span class="tl-col"
              ><span class="tl-run">
                <span class="tl-tile tl-lilac tl-c"
                  ><i></i><i></i><i></i><b>Onboard without calls.</b><small>ClassroomIO / customer training</small
                  ></span
                >
                <span class="tl-tile tl-lime tl-a"
                  ><i></i><i></i><i></i><b>Train at scale.</b><small>ClassroomIO / customer training</small></span
                >
                <span class="tl-tile tl-blue tl-b"
                  ><i></i><i></i><i></i><b>Every customer, certified.</b><small>ClassroomIO / customer training</small
                  ></span
                >
              </span></span
            >
            <span class="tl-col"
              ><span class="tl-run">
                <span class="tl-tile tl-navy tl-b"
                  ><i></i><i></i><i></i><b>Experts, only when needed.</b><small>ClassroomIO / customer training</small
                  ></span
                >
                <span class="tl-tile tl-lilac tl-a"
                  ><i></i><i></i><i></i><b>No more demo calls.</b><small>ClassroomIO / customer training</small></span
                >
                <span class="tl-tile tl-mint tl-c"
                  ><i></i><i></i><i></i><b>Ship it once.</b><small>ClassroomIO / customer training</small></span
                >
              </span></span
            >
          </span>
        </span>
      </article>
      <a
        class="relative flex min-h-[400px] flex-col overflow-hidden rounded-[var(--radius)] bg-[#0b1233] p-6 text-white max-sm:min-h-0"
        href="https://classroomio.com/docs/developers"
        data-in
        style="--d:.32s"
      >
        <span class="relative z-[2] mb-5 flex items-center justify-between">
          <span
            class="inline-flex h-[26px] items-center rounded-full border border-white/[0.22] bg-white/[0.14] px-[11px] text-[12.5px] font-medium text-white"
            >Agent friendly</span
          >
          <span class="ab-go grid h-[30px] w-[30px] place-items-center rounded-full bg-white text-[#0b1233]"
            ><svg class="h-3.5 w-3.5" viewBox="0 0 16 16" aria-hidden="true"
              ><path
                d="M3 8h10M9 4l4 4-4 4"
                fill="none"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
              /></svg
            ></span
          >
        </span>
        <h3 class="m-0 text-[18px] leading-[1.25] font-medium tracking-[-0.02em] text-white">
          Built for agents as well as people
        </h3>
        <p class="mt-2.5 mb-6 text-[14.5px] leading-[1.55] text-white/80">
          Draft courses with AI, answer learners with the AI Tutor, and let agents in Claude, Cursor or any MCP client
          do the admin.
        </p>
        <span class="df-pic df-trio relative mt-auto h-[160px] overflow-hidden rounded-[var(--radius)]"
          ><img
            class="absolute inset-0 object-cover object-[50%_58%]"
            src="/home/images/team-trio.jpg"
            alt="Three ClassroomIO team members smiling together"
          /></span
        >
      </a>
    </div>
  </section>

  <FaqSection />

  <StoryCarousel toneWord="ClassroomIO." />

  <CtaSection />
</main>

<style>
  /* animation overrides — keep prototype class names for JS targeting */
  .ab {
    --spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .ab .fx {
    border-inline: 0;
  }

  /* team card hover lift */
  .ab-card:hover .ab-tag {
    transform: translateY(-4px);
  }
  .ab-tag {
    transition: transform 0.5s var(--ease);
  }

  /* arrow link rotation on hover */
  a.ab-c:hover .ab-go {
    transform: rotate(-45deg);
  }
  .ab-go {
    transition: transform 0.4s var(--spring);
  }

  /* differentiator open card gradient overlay */
  .df-open::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(11, 18, 51, 0.1) 20%, rgba(11, 18, 51, 0.85));
  }

  /* df-dev overlay gradient */
  .df-dev::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    background: linear-gradient(180deg, rgba(11, 18, 51, 0) 50%, rgba(11, 18, 51, 0.6) 100%);
  }

  /* card image hover */
  .ab-c img {
    transition: transform 1.2s var(--ease);
  }
  .ab-c:hover img {
    transform: scale(1.05);
  }
</style>
