<script lang="ts">
  import { toast } from 'svelte-sonner';

  import { CardBody, CardContainer } from '$lib/components/animation/card';
  import { BlurFade } from '$lib/components/animation/blurfade';
  import { BlurIn } from '$lib/components/animation/blurin';
  import { Button } from '$lib/components/ui/button';
  import { TemplateCard } from '$lib/components/template-card';
  import { Meteors } from '$lib/components/animation/meteors';
  import { Separator } from '$lib/components/ui/separator';
  import { ShinnyText } from '$lib/components/animation/shinny-text';
  import { ShimmerButton } from '$lib/components/animation/shimmerbutton';
  import Copy from 'lucide-svelte/icons/copy';
  import { cn } from '$lib/utils';

  const templates = [
    {
      name: 'Cal',
      image: 'https://cdn.courseapp.oncws.com/templates/cal-template.png',
      url: 'https://cal.courseapp.oncws.com',
      github: 'https://github.com/classroomio/classroomio'
    },
    {
      name: 'PostHog',
      image: 'https://cdn.courseapp.oncws.com/templates/posthog-template.png',
      url: 'https://posthog.courseapp.oncws.com',
      github: 'https://github.com/classroomio/classroomio'
    },
    {
      name: 'Classic',
      image: 'https://cdn.courseapp.oncws.com/templates/classic-template.png',
      url: 'https://classic.courseapp.oncws.com',
      github: 'https://github.com/classroomio/classroomio'
    },
    {
      name: 'Examprep',
      image: 'https://cdn.courseapp.oncws.com/templates/examprep-template.png',
      url: 'https://examprep.courseapp.oncws.com',
      github: 'https://github.com/classroomio/classroomio'
    },
    {
      name: 'Minimal',
      image: 'https://cdn.courseapp.oncws.com/templates/minimal.png',
      url: 'https://minimal.courseapp.oncws.com',
      github: 'https://github.com/classroomio/classroomio'
    }
  ];
</script>

<!-- Hero -->
<section class="my-5 w-full md:mb-20 md:mt-0">
  <div class="">
    <CardContainer className="md:px-20">
      <CardBody
        className="max-w-4xl min-h-[50vh] flex flex-col justify-center px-30 gap-2 md:gap-5"
      >
        <BlurIn
          class="pointer-events-none flex max-w-2xl flex-col items-start whitespace-pre-wrap bg-gradient-to-b from-black to-gray-300/80 bg-clip-text text-4xl font-semibold leading-none tracking-tighter text-transparent md:mb-4 md:block md:text-6xl"
        >
          Create a <span class="font-mono italic text-blue-700">UNIVERSITY</span>
          <span>Site for your SAAS in</span>
          <span class="ml-1 font-mono italic text-blue-700">MINUTES</span>
        </BlurIn>

        <BlurFade delay={0.25 * 2}>
          <p class="text-md">
            With our prebuilt templates, you can setup a fully functional customer educational site
            for your product in minutes.<br />
            <span>
              Similar to the likes of

              <Button variant="link" class="h-fit p-0" href="https://university.webflow.com/">
                Webflow,
              </Button>
              <Button variant="link" class="h-fit p-0" href="https://academy.hubspot.com/">
                Hubspot,
              </Button>
              <Button
                variant="link"
                class="h-fit p-0"
                href="https://university.atlassian.com/student/activity/2227111-home#/page/670e8ce7a1887954d13a856a"
              >
                Atlassian &
              </Button>
              <Button variant="link" class="h-fit p-0" href="https://framer.university/"
                >Framer</Button
              >
            </span>
          </p>

          <button
            onclick={() => {
              navigator.clipboard.writeText('pnpx @classroomio/course-app');
              toast('Copied to clipboard 😉');
            }}
            class={cn(
              'group z-10 mt-5 rounded-full border  border-white/50 bg-neutral-700 transition-all  ease-in hover:cursor-pointer hover:bg-neutral-700 hover:text-white'
            )}
          >
            <ShinnyText
              class="animate-gradient inline-flex items-center justify-center bg-gradient-to-r from-[#ffaa40]  via-[#9c40ff] to-[#ffaa40] bg-[length:var(--bg-size)_100%]  bg-clip-text px-4 py-1 text-transparent text-white transition ease-out hover:text-neutral-400 hover:duration-300"
            >
              <span>pnpx @classroomio/course-app</span>

              <Copy class="ml-2 size-3" />
            </ShinnyText>
          </button>
        </BlurFade>
      </CardBody>
    </CardContainer>
  </div>
</section>
<!-- Hero End -->

<!-- Templates -->
<section id="templates" class="my-5 w-full pt-0 md:my-10 md:pt-24">
  <div class="container">
    <h2 class="mb-5 text-center text-3xl font-semibold md:mb-20 md:text-start md:text-5xl">
      Browser Templates
    </h2>

    <div class="grid max-w-6xl grid-cols-1 place-items-center gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each templates as template, index}
        <BlurFade delay={0.25 + index * 0.25}>
          <TemplateCard {template} />
        </BlurFade>
      {/each}
    </div>
  </div>
</section>

<!-- Templates End -->

<Separator class="my-20" />

<!-- Setup -->
<section id="setup" class="mb-20 w-full">
  <BlurFade delay={0.25}>
    <div class="container">
      <!-- <h2 class="mb-10 text-center text-5xl font-semibold">
        Up & Running <span class="font-mono italic text-blue-700">MINUTES</span>
      </h2> -->

      <div
        class="relative mx-auto h-fit w-full max-w-3xl overflow-hidden rounded-lg border bg-neutral-800 p-20 py-40 text-center shadow-2xl"
      >
        <Meteors number={30} />

        <h1 class="mb-5 text-5xl font-semibold text-white">
          Start Customising Your University Site
        </h1>

        <div class="z-10 flex items-center justify-center">
          <ShimmerButton
            onClick={() => {
              window.location.href =
                'https://github.com/classroomio/classroomio/blob/a6af412b2401a8dc3f871773b96a24b2fa764f52/packages/course-app/README.md';
            }}
            class="shadow-2xl"
          >
            <span
              class="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white lg:text-lg dark:from-white dark:to-slate-900/10"
            >
              Go to Docs
            </span>
          </ShimmerButton>
        </div>
      </div>
    </div>
  </BlurFade>
</section>

<!-- Setup End -->

<Separator class="mt-20" />

<!-- Footer -->
<section class="my-10 w-full">
  <div class="container">
    <p class="text-center text-sm text-neutral-500">
      Made with ❤️ by <a href="https://git.new/class">classroomio</a>
    </p>
  </div>
</section>
<!-- Footer End -->
