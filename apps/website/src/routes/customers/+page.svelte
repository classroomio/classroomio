<script lang="ts">
  import { onMount } from 'svelte';
  import PrototypeHead from '$lib/components/homepage/prototype-head.svelte';
  import { STORY_SLIDES } from '$lib/data/homepage-data';
  import FaqSection from '$lib/components/homepage/faq-section.svelte';
  import CtaSection from '$lib/components/homepage/cta-section.svelte';
  import { loadPrototypeScripts } from '$lib/utils/load-prototype-scripts';

  onMount(() => loadPrototypeScripts(['/home/customers.js', '/home/flow.js']));
</script>

<PrototypeHead
  title="Customer Stories | ClassroomIO"
  description="How training businesses, software companies and educators teach with ClassroomIO, the open source customer education platform."
  stylesheets={['/home/customers.css']}
  sections={false}
/>

<main id="top" class="cu">
  <section class="cu-hero" aria-labelledby="cu-title">
    <div class="cu-wrap">
      <span class="ab-pill" data-in>Customer stories</span>
      <h1 id="cu-title" data-split>
        Meet the <em>Companies</em>
        <span class="cu-faces" id="cu-faces" aria-hidden="true">
          <span class="cu-face" style="--k:0" data-story="1" data-name="Jody · QuickEasy"
            ><img src="/home/images/jody.webp" alt="" /></span
          >
          <span class="cu-face" style="--k:1" data-story="2" data-name="Pranav · dBlocked"
            ><img src="/home/images/pranav.webp" alt="" /></span
          >
          <span class="cu-face" style="--k:2" data-story="3" data-name="Dr Ozzy"
            ><img src="/home/images/drozzy.webp" alt="" /></span
          >
          <span class="cu-face" style="--k:3" data-story="0" data-name="Andrew · SensorHubb"
            ><img src="/home/images/sensorhubb-poster.webp" alt="" /></span
          >
        </span>
        using ClassroomIO.
      </h1>
      <p class="cu-lede" data-in>
        Training businesses, software companies and educators on what changed when they moved their teaching to
        ClassroomIO, in their own words.
      </p>
      <div class="cu-hero-ctas" data-in>
        <a class="btn btn-blue" href="https://classroomio.com/signup">Start for free</a>
        <a class="btn btn-line" href="#stories">Read the stories</a>
      </div>

      <div class="ts" id="ts" data-in>
        <div class="ts-tabs" role="tablist" aria-label="Customer stories">
          {#each STORY_SLIDES as slide, index}
            <button class="ts-tab" class:on={index === 0} role="tab" aria-selected={index === 0}>
              {#if slide.tab.type === 'image'}
                <img class:mono={slide.tab.mono} src={slide.tab.src} alt={slide.tab.alt} />
              {:else}
                <span>{slide.tab.text}</span>
              {/if}
              <i></i>
            </button>
          {/each}
        </div>

        <div class="ts-slides">
          {#each STORY_SLIDES as slide, index}
            <div class="ts-slide" class:on={index === 0}>
              <div class="ts-card">
                <div class="ts-photo" class:ts-portrait={slide.photo.portrait}>
                  <img src={slide.photo.src} alt={slide.photo.alt} />
                  {#if slide.photo.hasPlay}
                    <span class="play" aria-hidden="true"></span>
                    <span class="story-len">{slide.photo.storyLength}</span>
                  {/if}
                </div>
                <div class="ts-body">
                  <blockquote>{slide.quote}</blockquote>
                  <div class="ts-meta">
                    <span class="ts-chip"><b>{slide.person.split(' · ')[0]}</b> · {slide.person.split(' · ')[1]}</span>
                    {#if slide.logo}
                      <span class="ts-chip ts-logo"
                        ><img class:mono={slide.logo.mono} src={slide.logo.src} alt={slide.logo.alt} /></span
                      >
                    {/if}
                    {#if slide.link}
                      <a
                        class="ts-link"
                        href={slide.link.href}
                        target={slide.link.external ? '_blank' : undefined}
                        rel={slide.link.external ? 'noopener' : undefined}>{slide.link.text} <span>›</span></a
                      >
                    {/if}
                  </div>
                </div>
              </div>
              <div class="ts-stats">
                {#each slide.stats as stat}
                  <div><b>{stat.label}</b><span>{stat.detail}</span></div>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </section>

  <section class="cu-grid-sec" id="stories" aria-label="Customer stories">
    <div class="cu-wrap">
      <div class="cu-grid">
        <article class="cu-card" data-in>
          <div class="cu-card-tag"><b>QuickEasy Business Systems</b><span>Client training</span></div>
          <h3><a class="cu-card-link" href="/customers/quickeasy">Clients see how their staff are doing</a></h3>
          <p>
            &ldquo;We love it because it helps us get training material out to clients, while clients can also monitor
            progress of their staff.&rdquo;
          </p>
          <div class="cu-card-foot">
            <img src="/home/images/jody.webp" alt="" width="40" height="40" />
            <div class="cu-card-who"><b>Jody Segers</b><small>MD</small></div>
            <a class="cu-card-go" href="/customers/quickeasy">Read story →</a>
          </div>
        </article>

        <article class="cu-card" data-in>
          <div class="cu-card-tag"><b>SensorHubb</b><span>Customer training</span></div>
          <h3><a class="cu-card-link" href="/customers/sensorhubb">Prompt, professional support</a></h3>
          <p>
            &ldquo;My favorite part of using ClassroomIO has been the extremely professional and prompt response from
            their team.&rdquo;
          </p>
          <div class="cu-card-foot">
            <img src="/home/images/sensorhubb-poster.webp" alt="" width="40" height="40" />
            <div class="cu-card-who"><b>Andrew Bedell</b><small>Strategy and Operations Intern</small></div>
            <a class="cu-card-go" href="/customers/sensorhubb">Read story →</a>
          </div>
        </article>

        <article class="cu-card" data-in>
          <div class="cu-card-tag"><b>dBlocked</b><span>Web3 courses</span></div>
          <h3><a class="cu-card-link" href="/customers/dblocked">A program bootstrapped on ClassroomIO</a></h3>
          <p>
            &ldquo;ClassroomIO really helped me bootstrap my program. The dashboard is extremely intuitive. I could
            navigate most of it without any help.&rdquo;
          </p>
          <div class="cu-card-foot">
            <img src="/home/images/pranav.webp" alt="" width="40" height="40" />
            <div class="cu-card-who"><b>Pranav Singhal</b><small>Web3 instructor</small></div>
            <a class="cu-card-go" href="/customers/dblocked">Read story →</a>
          </div>
        </article>

        <article class="cu-card" data-in>
          <div class="cu-card-tag"><b>Dr Ozzy</b><span>Academic programs</span></div>
          <h3><a class="cu-card-link" href="/customers/dr-ozzy">Focus on learning, not the platform</a></h3>
          <p>
            &ldquo;ClassroomIO helps me focus on the learning experience rather than getting caught up in a complicated
            platform.&rdquo;
          </p>
          <div class="cu-card-foot">
            <img src="/home/images/drozzy.webp" alt="" width="40" height="40" />
            <div class="cu-card-who"><b>Dr Ozzy</b><small>Academic Programs Coordinator</small></div>
            <a class="cu-card-go" href="/customers/dr-ozzy">Read story →</a>
          </div>
        </article>

        <article class="cu-card" data-in>
          <div class="cu-card-tag"><b>dBlocked</b><span>Web3 courses</span></div>
          <h3><a class="cu-card-link" href="/customers/dblocked">Flat pricing and open source</a></h3>
          <p>
            &ldquo;Flat pricing, open source and great customer support. I have yet to find a better platform for
            hosting courses.&rdquo;
          </p>
          <div class="cu-card-foot">
            <img src="/home/images/pranav.webp" alt="" width="40" height="40" />
            <div class="cu-card-who"><b>Pranav Singhal</b><small>Web3 instructor</small></div>
            <a class="cu-card-go" href="/customers/dblocked">Read story →</a>
          </div>
        </article>

        <article class="cu-card cu-card-cta" data-in>
          <div class="cu-card-tag"><b>Your team</b><span>Next story</span></div>
          <h3>Teach your customers with ClassroomIO</h3>
          <p>Start free, or talk to us if you want a hand setting things up.</p>
          <div class="cu-card-foot">
            <a class="btn btn-white" href="https://classroomio.com/signup">Start for free</a>
            <a class="cu-card-go" href="https://cal.com/classroomio/demo">Book a demo →</a>
          </div>
        </article>
      </div>
    </div>
  </section>

  <FaqSection />

  <CtaSection />
</main>
