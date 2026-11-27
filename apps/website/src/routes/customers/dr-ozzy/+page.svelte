<script lang="ts">
  import { onMount } from 'svelte';
  import PrototypeHead from '$lib/components/homepage/prototype-head.svelte';
  import FaqSection from '$lib/components/homepage/faq-section.svelte';
  import CtaSection from '$lib/components/homepage/cta-section.svelte';
  import { loadPrototypeScripts } from '$lib/utils/load-prototype-scripts';

  onMount(() => loadPrototypeScripts(['/home/customers.js', '/home/flow.js']));
</script>

<PrototypeHead
  title="Dr Ozzy | ClassroomIO Customers"
  description="How Dr Ozzy keeps the focus on learning with ClassroomIO, the open source customer education platform."
  stylesheets={['/home/customers.css']}
  sections={false}
/>

<main id="top" class="cu">
  <div class="cu-wrap cs-crumbs">
    <nav aria-label="Breadcrumb">
      <a href="/">Home</a><i>›</i><a href="/customers">Customers</a><i>›</i><span aria-current="page">Dr Ozzy</span>
    </nav>
  </div>

  <section class="cs-hero">
    <div class="cu-wrap">
      <div class="cs-hero-box">
        <span class="cs-logo cs-logo-text">Dr Ozzy</span>
        <h1 id="cs-title" data-split>How Dr Ozzy keeps the focus on learning with ClassroomIO</h1>
      </div>
    </div>
  </section>

  <section class="cs-body">
    <div class="cu-wrap cs-grid">
      <div class="cs-main">
        <section class="cs-sec" data-in>
          <h2>Results</h2>
          <p>
            Dr Ozzy says ClassroomIO helps keep the focus on the learning experience rather than a complicated platform,
            and that it has been a positive experience overall.
          </p>
          <blockquote class="cs-quote">
            <p>
              &ldquo;ClassroomIO helps me focus on the learning experience rather than getting caught up in a
              complicated platform.&rdquo;
            </p>
            <cite>Dr Ozzy, Academic Programs Coordinator</cite>
          </blockquote>
        </section>
        <section class="cs-sec" data-in>
          <h2>Recommendation</h2>
          <p>
            Dr Ozzy would recommend ClassroomIO to a friend or colleague who is looking for a practical platform to
            deliver their courses.
          </p>
          <blockquote class="cs-quote">
            <p>
              &ldquo;I'd definitely recommend ClassroomIO to a friend or colleague looking for a practical platform to
              deliver their courses.&rdquo;
            </p>
            <cite>Dr Ozzy, Academic Programs Coordinator</cite>
          </blockquote>
        </section>
        <a class="btn btn-line" href="/customers">← Back to Customers</a>
      </div>
      <aside class="cs-aside" data-in>
        <h2>About the company</h2>
        <div class="cs-chips"><span>Academic programs</span></div>
        <p>Dr Ozzy is an Academic Programs Coordinator who delivers courses on ClassroomIO.</p>
      </aside>
    </div>
  </section>

  <FaqSection />

  <CtaSection />
</main>
