<script lang="ts">
  import { onMount } from 'svelte';
  import PrototypeHead from '$lib/components/homepage/prototype-head.svelte';
  import StoryCarousel from '$lib/components/homepage/story-carousel.svelte';
  import FaqSection from '$lib/components/homepage/faq-section.svelte';
  import CtaSection from '$lib/components/homepage/cta-section.svelte';
  import { loadPrototypeScripts } from '$lib/utils/load-prototype-scripts';
  import { CLOUD_PLANS, SELF_HOSTED_PLANS } from '$lib/data/homepage-data';

  let mainEl: HTMLElement;

  onMount(() => loadPrototypeScripts(['/home/pricing.js', '/home/stories.js', '/home/flow.js']));
</script>

<PrototypeHead
  title="Pricing | ClassroomIO"
  description="Plans and prices for ClassroomIO, the open source customer education platform: Starter, Growth, Scale and Enterprise, plus self-hosted licences."
  stylesheets={['/home/pricing.css']}
/>

<main id="top" class="pr" bind:this={mainEl}>
  <section class="pr-hero" aria-labelledby="pr-title">
    <div class="pr-bg" aria-hidden="true">
      <div class="pr-bg-plane">
        <i style="--x:8;--y:12;--d:0s"></i><i style="--x:12;--y:8;--d:3s"></i><i style="--x:13;--y:10;--d:6s"></i><i
          style="--x:9;--y:13;--d:4.5s"
        ></i>
      </div>
    </div>
    <span class="ab-pill" data-in>Pricing</span>
    <h1 class="pr-title" id="pr-title" data-split>
      Simple pricing that scales <span class="tone">with your learners</span>
    </h1>
    <p class="sub" data-in>
      Unlimited video streaming, the API on the main plan and no transaction fees. You pay for active learners, not
      sign-ups.
    </p>
    <div class="pr-toggle" role="radiogroup" aria-label="Billing period" data-in>
      <button type="button" role="radio" aria-checked="false" data-period="monthly">Monthly</button>
      <button type="button" role="radio" aria-checked="true" data-period="yearly">Yearly <em>2 months free</em></button>
      <i class="pr-toggle-knob" aria-hidden="true"></i>
    </div>
  </section>

  <section class="pr-plans" id="plans" aria-label="Cloud plans">
    {#each CLOUD_PLANS as plan}
      <article
        class="pr-plan"
        class:pr-main={plan.isMain}
        class:pr-ent={plan.isEnterprise}
        data-in
        style="--d:{plan.delay}"
      >
        <h2>
          {plan.name}
          {#if plan.tag}<span class="pr-tag">{plan.tag}</span>{/if}
        </h2>
        <p class="pr-plan-d">{plan.description}</p>
        {#if plan.customPrice}
          <div class="pr-price"><b>{plan.customPrice}</b></div>
          <p class="pr-bill">{plan.customBill}</p>
        {:else}
          <div class="pr-price">
            <b data-monthly={plan.monthlyPrice} data-yearly={plan.yearlyPrice}>${plan.yearlyPrice}</b><span>/month</span
            >
          </div>
          <p class="pr-bill" data-monthly={plan.monthlyBill} data-yearly={plan.yearlyBill}>{plan.yearlyBill}</p>
        {/if}
        <span class="pr-chip">{plan.chip}</span>
        <a class="btn btn-{plan.cta.style}" href={plan.cta.href}>{plan.cta.text}</a>
        <ul class="pr-list">
          {#each plan.features as feature}
            <li class:pr-plus={feature.isPlus}>{feature.text}</li>
          {/each}
        </ul>
      </article>
    {/each}
  </section>

  <section class="ab-sec" id="compare" aria-labelledby="cmp-title">
    <div class="ab-head">
      <span class="ab-pill" data-in>Compare plans</span>
      <h2 class="h2 ab-h" id="cmp-title" data-split>Find the right plan for your academy</h2>
      <p class="sub" data-in>Every plan includes unlimited video streaming and 0% transaction fees.</p>
    </div>
    <div class="cmp-wrap" data-in>
      <table class="cmp">
        <thead>
          <tr>
            <th scope="col"><span class="cmp-k">Features</span><small>What each plan includes</small></th>
            <th scope="col">Starter<b data-monthly="$39" data-yearly="$32.50">$32.50</b><small>a month</small></th>
            <th scope="col" class="cmp-main"
              >Growth<b data-monthly="$99" data-yearly="$82.50">$82.50</b><small>a month</small></th
            >
            <th scope="col">Scale<b data-monthly="$299" data-yearly="$249">$249</b><small>a month</small></th>
            <th scope="col">Enterprise<b>Custom</b><small>annual</small></th>
          </tr>
        </thead>
        <tbody>
          <tr class="cmp-group"><th scope="rowgroup" colspan="5">Usage</th></tr>
          <tr
            ><th scope="row">Monthly active learners</th><td>200</td><td class="cmp-main">1,000</td><td>5,000</td><td
              >Above 5,000</td
            ></tr
          >
          <tr><th scope="row">Admin seats</th><td>2</td><td class="cmp-main">5</td><td>15</td><td>Unlimited</td></tr>
          <tr
            ><th scope="row">Courses</th><td>Unlimited</td><td class="cmp-main">Unlimited</td><td>Unlimited</td><td
              >Unlimited</td
            ></tr
          >
          <tr
            ><th scope="row">Video streaming</th><td>Unlimited</td><td class="cmp-main">Unlimited</td><td>Unlimited</td
            ><td>Unlimited</td></tr
          >
          <tr
            ><th scope="row">Included storage <span class="pr-draft">Proposed</span></th><td>25 GB</td><td
              class="cmp-main">250 GB</td
            ><td>1 TB</td><td>Custom</td></tr
          >
          <tr
            ><th scope="row">AI tokens a month</th><td>3M</td><td class="cmp-main">3M</td><td>10M</td><td>Custom</td
            ></tr
          >
          <tr><th scope="row">Transaction fees</th><td>0%</td><td class="cmp-main">0%</td><td>0%</td><td>0%</td></tr>

          <tr class="cmp-group"><th scope="rowgroup" colspan="5">Courses and certificates</th></tr>
          <tr
            ><th scope="row">All quiz question types</th><td><i class="y">Included</i></td><td class="cmp-main"
              ><i class="y">Included</i></td
            ><td><i class="y">Included</i></td><td><i class="y">Included</i></td></tr
          >
          <tr
            ><th scope="row">Video transcription and AI assistant</th><td><i class="y">Included</i></td><td
              class="cmp-main"><i class="y">Included</i></td
            ><td><i class="y">Included</i></td><td><i class="y">Included</i></td></tr
          >
          <tr
            ><th scope="row">Multi-language</th><td><i class="y">Included</i></td><td class="cmp-main"
              ><i class="y">Included</i></td
            ><td><i class="y">Included</i></td><td><i class="y">Included</i></td></tr
          >
          <tr
            ><th scope="row">MCP server</th><td><i class="y">Included</i></td><td class="cmp-main"
              ><i class="y">Included</i></td
            ><td><i class="y">Included</i></td><td><i class="y">Included</i></td></tr
          >
          <tr
            ><th scope="row">Branded certificates</th><td><i class="y">Included</i></td><td class="cmp-main"
              ><i class="y">Included</i></td
            ><td><i class="y">Included</i></td><td><i class="y">Included</i></td></tr
          >
          <tr
            ><th scope="row">Verifiable certificates</th><td><i class="n">Not included</i></td><td class="cmp-main"
              ><i class="y">Included</i></td
            ><td><i class="y">Included</i></td><td><i class="y">Included</i></td></tr
          >
          <tr
            ><th scope="row">Learning paths with prerequisites</th><td><i class="n">Not included</i></td><td
              class="cmp-main"><i class="y">Included</i></td
            ><td><i class="y">Included</i></td><td><i class="y">Included</i></td></tr
          >
          <tr
            ><th scope="row">Advanced certification programmes</th><td><i class="n">Not included</i></td><td
              class="cmp-main"><i class="n">Not included</i></td
            ><td><i class="y">Included</i></td><td><i class="y">Included</i></td></tr
          >

          <tr class="cmp-group"><th scope="rowgroup" colspan="5">Brand and integrations</th></tr>
          <tr
            ><th scope="row">Custom branding</th><td><i class="y">Included</i></td><td class="cmp-main"
              ><i class="y">Included</i></td
            ><td><i class="y">Included</i></td><td><i class="y">Included</i></td></tr
          >
          <tr
            ><th scope="row">Custom domain with SSL</th><td><i class="n">Not included</i></td><td class="cmp-main"
              ><i class="y">Included</i></td
            ><td><i class="y">Included</i></td><td><i class="y">Included</i></td></tr
          >
          <tr
            ><th scope="row">Remove ClassroomIO branding</th><td><i class="n">Not included</i></td><td class="cmp-main"
              ><i class="y">Included</i></td
            ><td><i class="y">Included</i></td><td><i class="y">Included</i></td></tr
          >
          <tr
            ><th scope="row">REST API, webhooks and Zapier</th><td><i class="n">Not included</i></td><td
              class="cmp-main"><i class="y">Included</i></td
            ><td><i class="y">Included</i></td><td><i class="y">Included</i></td></tr
          >
          <tr
            ><th scope="row">Multiple academies</th><td><i class="n">Not included</i></td><td class="cmp-main"
              ><i class="y">Included</i></td
            ><td><i class="y">Included</i></td><td><i class="y">Included</i></td></tr
          >
          <tr
            ><th scope="row">Native CRM integration</th><td><i class="n">Not included</i></td><td class="cmp-main"
              ><i class="n">Not included</i></td
            ><td><i class="y">Included</i></td><td><i class="y">Included</i></td></tr
          >

          <tr class="cmp-group"><th scope="rowgroup" colspan="5">Security and support</th></tr>
          <tr
            ><th scope="row">SSO (OIDC) and SCIM</th><td><i class="n">Not included</i></td><td class="cmp-main"
              ><i class="n">Not included</i></td
            ><td><i class="n">Not included</i></td><td><i class="y">Included</i></td></tr
          >
          <tr
            ><th scope="row">Audit logs and SLA</th><td><i class="n">Not included</i></td><td class="cmp-main"
              ><i class="n">Not included</i></td
            ><td><i class="n">Not included</i></td><td><i class="y">Included</i></td></tr
          >
          <tr
            ><th scope="row">Support</th><td>Email</td><td class="cmp-main">Priority email</td><td>Named contact</td><td
              >Priority, named contact</td
            ></tr
          >
        </tbody>
      </table>
    </div>
    <p class="cmp-note" data-in>
      Storage amounts are proposed and not final. Extra storage will be available as a paid add-on.
    </p>
  </section>

  <section class="ab-sec" id="self-host" aria-labelledby="sh-title">
    <div class="ab-head">
      <span class="ab-pill" data-in>Self-hosted</span>
      <h2 class="h2 ab-h" id="sh-title" data-split>Prefer to host it yourself?</h2>
      <p class="sub" data-in>Open source and self-hostable, with fully published prices. Licensed per organisation.</p>
    </div>
    <div class="sh">
      {#each SELF_HOSTED_PLANS as plan}
        <article class="pr-plan sh-plan" class:pr-main={plan.isMain} data-in style="--d:{plan.delay}">
          <h3>{plan.name}</h3>
          <p class="pr-plan-d">{plan.description}</p>
          <div class="pr-price"><b>{plan.price}</b><span>{plan.priceSuffix}</span></div>
          <a class="btn btn-{plan.cta.style}" href={plan.cta.href}>{plan.cta.text}</a>
          <ul class="pr-list">
            {#each plan.features as feature}
              <li class:pr-plus={feature.isPlus}>{feature.text}</li>
            {/each}
          </ul>
        </article>
      {/each}
    </div>
  </section>

  <StoryCarousel heading="See what teams are building with" toneWord="ClassroomIO." />

  <FaqSection />

  <CtaSection />
</main>
