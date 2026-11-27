<script lang="ts">
  import { onMount } from 'svelte';
  import PrototypeHead from '$lib/components/homepage/prototype-head.svelte';
  import FaqSection from '$lib/components/homepage/faq-section.svelte';
  import CtaSection from '$lib/components/homepage/cta-section.svelte';
  import { loadPrototypeScripts } from '$lib/utils/load-prototype-scripts';

  onMount(() => loadPrototypeScripts(['/home/customers.js', '/home/flow.js']));
</script>

<PrototypeHead
  title="QuickEasy Business Systems | ClassroomIO Customers"
  description="How QuickEasy Business Systems trains its clients with ClassroomIO, the open source customer education platform."
  stylesheets={['/home/customers.css']}
  sections={false}
/>

<main id="top" class="cu">
  <div class="cu-wrap cs-crumbs">
    <nav aria-label="Breadcrumb">
      <a href="/">Home</a><i>›</i><a href="/customers">Customers</a><i>›</i><span aria-current="page"
        >QuickEasy Business Systems</span
      >
    </nav>
  </div>

  <section class="cs-hero">
    <div class="cu-wrap">
      <div class="cs-hero-box">
        <span class="cs-logo cs-logo-text">QuickEasy Business Systems</span>
        <h1 id="cs-title" data-split>How QuickEasy Business Systems trains its clients with ClassroomIO</h1>
      </div>
    </div>
  </section>

  <section class="cs-body">
    <div class="cu-wrap cs-grid">
      <div class="cs-main">
        <section class="cs-sec" data-in>
          <h2>Challenge</h2>
          <p>
            QuickEasy needed a platform where it could set up training classes for its clients, some paid and some
            unpaid.
          </p>
        </section>
        <section class="cs-sec" data-in>
          <h2>Solution</h2>
          <p>
            QuickEasy chose ClassroomIO and worked with our founder to customise it for its needs. In Jody Segers'
            words, that eagerness to help was a game changer.
          </p>
        </section>
        <section class="cs-sec" data-in>
          <h2>Results</h2>
          <p>
            QuickEasy now gets training material out to its clients, and clients can monitor the progress of their own
            staff.
          </p>
          <blockquote class="cs-quote">
            <p>
              &ldquo;We love it because it helps us get training material out to clients, while clients can also monitor
              progress of their staff.&rdquo;
            </p>
            <cite>Jody Segers, MD of QuickEasy Business Systems</cite>
          </blockquote>
        </section>
        <a class="btn btn-line" href="/customers">← Back to Customers</a>
      </div>
      <aside class="cs-aside" data-in>
        <h2>About the company</h2>
        <div class="cs-chips"><span>Client training</span></div>
        <p>QuickEasy Business Systems sets up training classes for its clients, some paid and some unpaid.</p>
        <a class="cs-site" href="https://quickeasy.business" target="_blank" rel="noopener">quickeasy.business →</a>
      </aside>
    </div>
  </section>

  <FaqSection />

  <CtaSection />
</main>
