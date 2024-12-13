<script lang="ts">
	import { toast } from 'svelte-sonner';

	import { CardBody, CardContainer } from '$lib/components/animation/card';
	import { BlurFade } from '$lib/components/animation/blurfade';
	import { Button } from '$lib/components/ui/button';
	import { TemplateCard } from '$lib/components/template-card';
	import { Meteors } from '$lib/components/animation/meteors';
	import { Separator } from '$lib/components/ui/separator';
	import { ShinnyText } from '$lib/components/animation/shinny-text';
	import Copy from 'lucide-svelte/icons/copy';
	import { cn } from '$lib/utils';

	const templates = [
		{
			name: 'Cal',
			image: 'https://cdn.courseapp.oncws.com/templates/cal.png',
			url: 'https://university.webflow.com/',
			github: 'https://github.com/classroomio/classroomio'
		},
		{
			name: 'PostHog',
			image: 'https://cdn.courseapp.oncws.com/templates/posthog.png',
			url: 'https://university.webflow.com/',
			github: 'https://github.com/classroomio/classroomio'
		},
		{
			name: 'Classic',
			image: 'https://cdn.courseapp.oncws.com/templates/classic.png',
			url: 'https://university.webflow.com/',
			github: 'https://github.com/classroomio/classroomio'
		},
		{
			name: 'Examprep',
			image: 'https://cdn.courseapp.oncws.com/templates/examprep.png',
			url: 'https://university.webflow.com/',
			github: 'https://github.com/classroomio/classroomio'
		},
		{
			name: 'Minimal',
			image: 'https://cdn.courseapp.oncws.com/templates/minimal.png',
			url: 'https://university.webflow.com/',
			github: 'https://github.com/classroomio/classroomio'
		}
	];
</script>

<!-- Hero -->
<section class="mb-20 w-full">
	<div class="">
		<CardContainer>
			<CardBody className="max-w-4xl h-[50vh] flex flex-col justify-center px-10 gap-5">
				<BlurFade delay={0.25}>
					<h1
						class="pointer-events-none mb-4 whitespace-pre-wrap bg-gradient-to-b from-black to-gray-300/80 bg-clip-text text-6xl font-semibold leading-none tracking-tighter text-transparent"
					>
						Create a <span class="font-mono italic text-blue-700">UNIVERSITY</span> Site <br />
						for your SAAS in{' '}<span class="ml-1 font-mono italic text-blue-700">MINUTES</span>
					</h1>
				</BlurFade>

				<BlurFade delay={0.25 * 2}>
					<p class="text-md">
						With our prebuilt templates, you can setup a fully functional customer educational site
						for your product in minutes.<br />
						<span>
							Similar to the likes of

							<Button variant="link" class="p-1" href="https://university.webflow.com/">
								Webflow
							</Button>
							<Button variant="link" class="p-1" href="https://academy.hubspot.com/">
								Hubspot
							</Button>
							<Button
								variant="link"
								class="p-1"
								href="https://university.atlassian.com/student/activity/2227111-home#/page/670e8ce7a1887954d13a856a"
							>
								Atlassian
							</Button>
							<Button variant="link" class="p-1" href="https://framer.university/">Framer</Button>
						</span>
					</p>
				</BlurFade>
			</CardBody>
		</CardContainer>
	</div>
</section>
<!-- Hero End -->

<!-- Templates -->
<section id="templates" class="my-10 w-full pt-24">
	<div class="container">
		<h2 class="mb-20 text-5xl font-semibold">Browser Templates</h2>

		<div class="grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
			<h2 class="mb-10 text-center text-5xl font-semibold">
				Up & Running <span class="font-mono italic text-blue-700">MINUTES</span>
			</h2>

			<div
				class="relative mx-auto flex h-fit w-full max-w-3xl items-center justify-center overflow-hidden rounded-lg border bg-neutral-900 p-20 py-40 md:shadow-xl"
			>
				<Meteors number={30} />

				<button
					onclick={() => {
						navigator.clipboard.writeText('pnpx @classroomio/course-app');
						toast('Copied to clipboard 😉');
					}}
					class={cn(
						'group z-10 rounded-full border  border-white/5 bg-neutral-800 text-base text-white transition-all  ease-in hover:cursor-pointer hover:bg-neutral-700'
					)}
				>
					<ShinnyText
						class=" inline-flex items-center justify-center px-4 py-1 text-white transition ease-out hover:text-neutral-400  hover:duration-300"
					>
						<span>pnpx @classroomio/course-app</span>

						<Copy class="ml-2 size-3" />
					</ShinnyText>
				</button>
			</div>
		</div>
	</BlurFade>
</section>

<!-- Setup End -->

<Separator class="my-20" />

<!-- Instructions -->
<section class="mb-20 w-full">
	<div class="container">
		<h2 class="mb-10 text-center text-5xl font-semibold">
			After Setup, <span class="font-mono italic text-blue-700">What next?</span>
		</h2>
	</div>
</section>
<!-- Instructions End -->
