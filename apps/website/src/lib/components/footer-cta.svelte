<script lang="ts">
  import CtaButton from './ui/cta-button.svelte';
  import Section from './ui/section.svelte';
</script>

<Section class="bg-gray-50 text-center" innerClass="flex flex-col items-center">
  <h2 class="text-h2 max-w-[900px] text-balance">
    Ready to replace Moodle<br />with something you'll <em class="text-blue-700 italic">actually enjoy?</em>
  </h2>
  <p class="text-lead mx-auto mt-[18px] max-w-[480px] text-gray-500">
    Get up and running in an afternoon. No vendor calls, no implementation fees, no surprises.
  </p>
  <div class="my-9 flex flex-wrap justify-center gap-3">
    <CtaButton href="/signup" class="bg-gray-950 hover:bg-blue-700 hover:brightness-100">Get Started Free →</CtaButton>
    <CtaButton variant="secondary" data-cal-link="classroomio/demo" data-cal-config="'layout':'month_view'">
      Book a Demo
    </CtaButton>
  </div>
  <p class="text-label font-mono text-gray-500 uppercase">Open source · Self-hosted · No credit card required</p>
</Section>
