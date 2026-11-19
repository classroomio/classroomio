<script lang="ts">
  import { PageHeader } from '$lib/components';
  import { CtaButton } from '$lib/components/ui';
</script>

<svelte:head>
  <title>Payment received | ClassroomIO</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<section>
  <PageHeader className="mx-auto flex max-w-content flex-col items-center justify-center px-6 text-center md:px-10">
    <h1 class="text-display flex flex-col items-center text-balance text-slate-900">
      <span>Payment received.</span>
      <span class="relative text-blue-700">Check your email.</span>
    </h1>
    <p class="text-lead mt-6 max-w-[560px] text-pretty text-slate-700">
      We sent you a link to set up your academy. Open it, create your account, and your Early Adopter plan connects
      automatically. If it does not arrive in a few minutes, check your spam folder.
    </p>
    <div class="mt-9">
      <CtaButton variant="secondary" href="/blog/early-adopter">Read why we built this plan</CtaButton>
    </div>
  </PageHeader>
</section>
