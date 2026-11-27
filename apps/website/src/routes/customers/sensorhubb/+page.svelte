<script lang="ts">
  import { onMount } from 'svelte';
  import PrototypeHead from '$lib/components/homepage/prototype-head.svelte';
  import FaqSection from '$lib/components/homepage/faq-section.svelte';
  import CtaSection from '$lib/components/homepage/cta-section.svelte';
  import { loadPrototypeScripts } from '$lib/utils/load-prototype-scripts';

  onMount(() => loadPrototypeScripts(['/home/customers.js', '/home/flow.js']));
</script>

<PrototypeHead
  title="SensorHubb | ClassroomIO Customers"
  description="How SensorHubb built its customer training on ClassroomIO, the open source customer education platform."
  stylesheets={['/home/customers.css']}
  sections={false}
/>

<main id="top" class="cu">
  <div class="cu-wrap cs-crumbs">
    <nav aria-label="Breadcrumb">
      <a href="/">Home</a><i>›</i><a href="/customers">Customers</a><i>›</i><span aria-current="page">SensorHubb</span>
    </nav>
  </div>

  <section class="cs-hero">
    <div class="cu-wrap">
      <div class="cs-hero-box">
        <span class="cs-logo"><img src="/home/images/sensorhubb-logo.png" alt="SensorHubb" /></span>
        <h1 id="cs-title" data-split>SensorHubb built its customer training on ClassroomIO</h1>
      </div>
    </div>
  </section>

  <section class="cs-body">
    <div class="cu-wrap cs-grid">
      <div class="cs-main">
        <div class="cs-stats" data-in>
          <div class="cs-stat"><b>5 stars</b><span>What Andrew would give us</span></div>
          <div class="cs-stat"><b>Recommended</b><span>For any SaaS platform that trains customers</span></div>
        </div>
        <section class="cs-sec" data-in>
          <h2>Solution</h2>
          <p>
            Andrew Bedell built a self-paced programme on ClassroomIO that teaches SensorHubb's customers how to use its
            product.
          </p>
        </section>
        <section class="cs-sec" data-in>
          <h2>Results</h2>
          <p>
            Andrew found customisation options and edge-case support he had not seen in other learning platforms. He
            says the team's quick, professional replies show they care about their customers and the experience.
          </p>
          <p>He would give ClassroomIO five stars and recommend it for any SaaS platform that trains its customers.</p>
          <blockquote class="cs-quote">
            <p>
              &ldquo;My favorite part of using ClassroomIO has been the extremely professional and prompt response from
              their team.&rdquo;
            </p>
            <cite>Andrew Bedell, Strategy and Operations Intern at SensorHubb</cite>
          </blockquote>
        </section>
        <a
          class="cs-video"
          href="https://assets.cdn.clsrio.com/www/home/andrew-bedell-sensorhubb-website.mp4"
          target="_blank"
          rel="noopener"
          aria-label="Watch the SensorHubb customer story"
          data-in
          ><img
            src="/home/images/sensorhubb-poster.webp"
            alt="Andrew Bedell, Strategy and Operations Intern at SensorHubb, looking at the camera"
          /><span class="cu-play"
            ><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5v9l7-4.5-7-4.5Z" fill="currentColor" /></svg
            >1:39</span
          ></a
        >
        <a class="btn btn-line" href="/customers">← Back to Customers</a>
      </div>
      <aside class="cs-aside" data-in>
        <h2>About the company</h2>
        <div class="cs-chips"><span>Customer training</span></div>
        <p>SensorHubb teaches its customers how to use its product with a self-paced programme.</p>
      </aside>
    </div>
  </section>

  <FaqSection />

  <CtaSection />
</main>
