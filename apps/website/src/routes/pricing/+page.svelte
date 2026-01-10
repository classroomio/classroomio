<script>
  import { Pricing } from '@cio/ui';
  import { PLANS } from '@cio/utils/plans';
  import { PageSignupCTA, PageHeader } from '$lib/components';
</script>

<svelte:head>
  <title>Pricing | ClassroomIO</title>
</svelte:head>

<section>
  <PageHeader className="flex flex-col items-center justify-center text-center">
    <h1 class="mx-auto flex flex-col items-center text-4xl text-slate-900 md:text-6xl">
      <span>There is room for</span>
      <span class="relative text-blue-700">Everyone.</span>
    </h1>
    <p class="mt-10 w-[90%] text-center text-lg font-normal text-slate-700 md:w-[60%] lg:mt-7">
      You get a customizable LMS, AI integration for productive educators and many more...
    </p>

    <script
      src="https://widget.senja.io/widget/b43ac234-427e-4d6f-8c23-633208154e54/platform.js"
      type="text/javascript"
      async
    ></script>
    <div
      class="senja-embed mt-5"
      data-id="b43ac234-427e-4d6f-8c23-633208154e54"
      data-mode="shadow"
      data-lazyload="false"
      style="display: block;"
    ></div>
  </PageHeader>

  <div class="flex flex-col items-center justify-center px-[6%] py-10">
    <Pricing.Root
      plans={PLANS}
      saveLabel="Save 2 months"
      cardProps={{
        ENTERPRISE: {
          'data-cal-config': "{'layout':'month_view'}",
          'data-cal-link': 'classroomio/enterprise'
        }
      }}
    />
  </div>
</section>

<PageSignupCTA
  header="Bring your bootcamp vision online"
  subText="Try before you buy. No credit card required."
  btnLabel="Sign up for free"
  link="/signup"
  demo={false}
/>
