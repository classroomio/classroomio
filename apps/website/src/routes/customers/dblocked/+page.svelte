<script lang="ts">
  import { onMount } from 'svelte';
  import PrototypeHead from '$lib/components/homepage/prototype-head.svelte';
  import FaqSection from '$lib/components/homepage/faq-section.svelte';
  import CtaSection from '$lib/components/homepage/cta-section.svelte';
  import { loadPrototypeScripts } from '$lib/utils/load-prototype-scripts';

  onMount(() => loadPrototypeScripts(['/home/customers.js', '/home/flow.js']));
</script>

<PrototypeHead
  title="dBlocked | ClassroomIO Customers"
  description="How dBlocked bootstrapped its Web3 program on ClassroomIO, the open source customer education platform."
  stylesheets={['/home/customers.css']}
  sections={false}
/>

<main id="top" class="cu">
  <div class="cu-wrap cs-crumbs">
    <nav aria-label="Breadcrumb">
      <a href="/">Home</a><i>›</i><a href="/customers">Customers</a><i>›</i><span aria-current="page">dBlocked</span>
    </nav>
  </div>

  <section class="cs-hero">
    <div class="cu-wrap">
      <div class="cs-hero-box">
        <span class="cs-logo cs-logo-text">dBlocked</span>
        <h1 id="cs-title" data-split>How dBlocked bootstrapped its Web3 program on ClassroomIO</h1>
      </div>
    </div>
  </section>

  <section class="cs-body">
    <div class="cu-wrap cs-grid">
      <div class="cs-main">
        <div class="cs-stats" data-in>
          <div class="cs-stat"><b>100+</b><span>Students in his Web3 bootcamp</span></div>
          <div class="cs-stat"><b>$35</b><span>Flat price per month for the paid plan at the time</span></div>
        </div>
        <section class="cs-sec" data-in>
          <h2>Challenge</h2>
          <p>
            Pranav Singhal wanted to share his Web3 course with as many Web3 enthusiasts as possible. He started
            building the course site in Framer, but it was getting expensive: he had to create a template and install
            plugins, and each had its own monthly cost.
          </p>
        </section>
        <section class="cs-sec" data-in>
          <h2>Solution</h2>
          <p>
            Pranav asked what it would cost to launch on ClassroomIO. At the time there was one paid plan, a flat $35 a
            month or $350 a year, that included 10,000 students, unlimited collaborators and Slack support.
          </p>
          <p>
            He launched his program on ClassroomIO and found the dashboard intuitive enough to navigate most of it
            without help.
          </p>
          <blockquote class="cs-quote">
            <p>
              &ldquo;ClassroomIO really helped me bootstrap my program. The dashboard is extremely intuitive. I could
              navigate most of it without any help or support. Coming from Framer, I can honestly say that I am
              extremely grateful that I found ClassroomIO.&rdquo;
            </p>
            <cite>Pranav Singhal, Web3 instructor</cite>
          </blockquote>
        </section>
        <section class="cs-sec" data-in>
          <h2>Results</h2>
          <p>Pranav became the first ClassroomIO customer to reach 100 students, in his Web3 bootcamp.</p>
          <blockquote class="cs-quote">
            <p>
              &ldquo;Flat pricing, open source and great customer support. I have yet to find a better platform for
              hosting courses.&rdquo;
            </p>
            <cite>Pranav Singhal, Web3 instructor</cite>
          </blockquote>
        </section>
        <a class="btn btn-line" href="/customers">← Back to Customers</a>
      </div>
      <aside class="cs-aside" data-in>
        <h2>About the company</h2>
        <div class="cs-chips"><span>Web3 courses</span></div>
        <p>dBlocked is a Web3 bootcamp run by Pranav Singhal, who built and teaches the program himself.</p>
        <a class="cs-site" href="https://dblocked.io/" target="_blank" rel="noopener">dblocked.io →</a>
      </aside>
    </div>
  </section>

  <FaqSection />

  <CtaSection />
</main>
