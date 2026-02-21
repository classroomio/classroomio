<script lang="ts">
  import { untrack } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { fade } from 'svelte/transition';
  import MailIcon from '@lucide/svelte/icons/mail';
  import PhoneIcon from '@lucide/svelte/icons/phone';
  import RocketIcon from '@lucide/svelte/icons/rocket';
  import MapPinIcon from '@lucide/svelte/icons/map-pin';
  import TwitterIcon from '@lucide/svelte/icons/twitter';
  import FacebookIcon from '@lucide/svelte/icons/facebook';
  import LinkedinIcon from '@lucide/svelte/icons/linkedin';
  import { preventDefault } from '$lib/utils/functions/svelte';

  import Navigation from '$lib/components/Navigation/index.svelte';
  import { PoweredBy } from '$features/ui';
  import { CourseCardList, CourseCardLoader } from '$features/course/components';
  import { landingPageSettings } from '$features/org/components/settings/landing-page-store';
  import { CoursesEmptyIcon } from '$features/ui/icons';

  import PageLoader from './page-loader.svelte';
  import * as Accordion from '@cio/ui/base/accordion';
  import * as Button from '@cio/ui/base/button';
  import * as Field from '@cio/ui/base/field';
  import { Input } from '@cio/ui/base/input';
  import { Textarea } from '@cio/ui/base/textarea';
  import { Empty } from '@cio/ui/custom/empty';
  import { t } from '$lib/utils/functions/translations';
  import type { AccountOrg } from '$features/app/types';
  import { orgApi } from '$features/org/api/org.svelte';
  import { validateEmail } from '$lib/utils/functions/validateEmail';
  import { orgLandingpageValidation } from '$lib/utils/functions/validator';
  import { MediaPlayer, isYoutubeUrl } from '$features/ui/media-player';

  interface Props {
    orgSiteName?: string;
    org: AccountOrg;
  }

  let { orgSiteName = '', org }: Props = $props();

  let email: string | undefined = $state('');
  let isAdding = $state(false);
  let success = $state(false);
  let successContactSaved = $state(false);
  let isContactSubmiting = $state(false);
  let contact = $state({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  let contactError: Record<string, string> = $state({});

  async function handleSubmit() {
    if (!email || !validateEmail(email) || !org) return;
    isAdding = true;

    // TODO: Implement email list submission

    success = true;
    setTimeout(() => {
      isAdding = false;
      success = false;
      email = undefined;
    }, 5000);
  }

  async function handleContactSubmit() {
    isContactSubmiting = true;
    contactError = orgLandingpageValidation(contact);
    if (Object.keys(contactError).length) {
      isContactSubmiting = false;
      return;
    }

    // Save to db
    // TODO: Implement contact submission

    isContactSubmiting = false;
    successContactSaved = true;
    contact = {
      name: '',
      email: '',
      phone: '',
      message: ''
    };
  }
  $effect(() => {
    if (!orgSiteName) return;

    orgApi.getPublicCoursesBySiteName(orgSiteName);
  });

  // Use default data in store if user hasn't added their own content to landing page
  function setDefault(landingpage) {
    if (landingpage && Object.keys(landingpage).length) {
      if (!landingpage?.header?.banner) {
        landingpage.header.banner = $landingPageSettings.header.banner;
      }

      untrack(() => {
        $landingPageSettings = {
          ...landingpage
        };
      });
    }
  }

  function getBgImage(settings) {
    const defaultImg = '/images/org-landingpage-banner.jpeg';

    const { show, image } = settings.header.background || {
      show: true,
      image: defaultImg
    };

    if (!show) {
      return undefined;
    }

    return `url('${image || defaultImg}')`;
  }

  $effect(() => {
    setDefault(org?.landingpage);
  });
</script>

<svelte:head>
  <title>
    {!org?.name ? '' : `${org.name}'s `}{$t('course.navItem.landing_page.landing_page')}
  </title>
</svelte:head>

<PoweredBy />

{#if !org?.landingpage}
  <PageLoader />
{:else}
  <main>
    <Navigation
      logo={org.avatarUrl || '/logo-192.png'}
      orgName={org.name}
      disableSignup={true}
      isOrgSite={true}
      customLinks={$landingPageSettings.customLinks}
    />
    <!-- Header Section -->
    {#if $landingPageSettings.header.show}
      <header
        id="header"
        class={`relative mb-10 h-screen w-full md:h-[90vh] ${
          $landingPageSettings.header.background?.show ? 'bg-cover bg-center' : 'border-b border-gray-300'
        }`}
        style="background-image: {getBgImage($landingPageSettings)}"
      >
        <div class="absolute top-0 z-10 h-screen w-full bg-white opacity-80 md:h-[90vh]"></div>
        {#if $landingPageSettings.header.banner.show}
          <div class="flex items-center justify-center py-2 md:h-full">
            <div
              class="relative z-20 flex w-full flex-col-reverse items-center justify-center md:w-11/12 md:flex-row md:justify-between lg:w-5/6"
            >
              <!-- Org Description -->
              <div class="mr-3 flex w-11/12 flex-col items-center py-10 md:w-2/5 md:items-start">
                <p class="ui:text-primary text-2xl font-semibold capitalize">
                  {org.name}
                </p>
                <h1 class="my-4 text-center text-4xl md:text-start md:text-5xl lg:text-6xl">
                  {$landingPageSettings.header.title} <br /><span class="ui:text-primary"
                    >{$landingPageSettings.header.titleHighlight}</span
                  >
                </h1>
                <p class="text-md mb-3 text-center text-xl md:mb-5 md:text-start">
                  {$landingPageSettings.header.subtitle}
                </p>

                <Button.Root
                  class="mt-2 w-fit px-10 md:mt-5"
                  onclick={() => {
                    $landingPageSettings.header.action.redirect && goto($landingPageSettings.header.action.link);
                  }}
                >
                  {$landingPageSettings.header.action.label}
                </Button.Root>
              </div>

              <div class="flex w-5/6 md:w-1/2 md:max-w-[650px]">
                {#if $landingPageSettings.header?.banner?.video && $landingPageSettings.header.banner.type === 'video'}
                  <div style="width:100%; border-radius:12px">
                    <MediaPlayer
                      source={{
                        type: isYoutubeUrl($landingPageSettings.header.banner.video) ? 'youtube' : 'generic',
                        url: $landingPageSettings.header.banner.video
                      }}
                      options={{
                        width: '100%',
                        height: '400'
                      }}
                      class="rounded-xl"
                    />
                  </div>
                {:else}
                  <img class="rounded-md" src={$landingPageSettings.header?.banner?.image} alt="landing page banner" />
                {/if}
              </div>
            </div>
          </div>
        {:else}
          <div class="relative z-20 flex h-full w-full items-center justify-center md:flex-row">
            <div class="mx-auto flex w-11/12 max-w-[600px] flex-col items-center py-10">
              <p class=" ui:text-primary text-2xl font-semibold capitalize">{org.name}</p>
              <h1 class="my-4 text-center text-4xl md:text-5xl lg:text-6xl">
                {$landingPageSettings.header.title} <br /><span class="ui:text-primary"
                  >{$landingPageSettings.header.titleHighlight}</span
                >
              </h1>
              <p class="text-md mb-6 text-center text-xl">
                {$landingPageSettings.header.subtitle}
              </p>

              <Button.Root
                class="mt-5 w-fit px-10"
                onclick={() => {
                  $landingPageSettings.header.action.redirect && goto($landingPageSettings.header.action.link);
                }}
              >
                {$landingPageSettings.header.action.label}
              </Button.Root>
            </div>
          </div>
        {/if}
      </header>
    {/if}

    <!-- Our Story section -->
    {#if $landingPageSettings.aboutUs.show}
      <section id="aboutus" class="m-h-[400px] mx-auto my-10 w-full max-w-6xl">
        <div class="mx-4 flex flex-col items-center justify-evenly lg:flex-row">
          <div class="mr-5 mb-5 max-w-[600px] lg:mb-0 lg:w-2/5">
            <h2 class="text-4xl md:text-5xl lg:text-6xl">{$landingPageSettings.aboutUs.title}</h2>
            <p class="mb-2">
              {$landingPageSettings.aboutUs.content}
            </p>
          </div>

          <div class="image">
            <img src={$landingPageSettings.aboutUs.imageUrl} alt="Our Story" class=" max-h-[450px] rounded-2xl" />
          </div>
        </div>
      </section>
    {/if}

    <!-- Courses Section -->
    {#if $landingPageSettings.courses.show}
      <section id="courses" transition:fade class="mx-auto my-10 w-full max-w-6xl">
        <div class="w-full">
          <div class="mx-auto w-11/12 max-w-[500px] py-10">
            <h1 class="my-4 text-center text-4xl md:text-5xl lg:text-6xl">
              {$landingPageSettings.courses.title}
              <span class="text-primary">{$landingPageSettings.courses.titleHighlight}</span>
            </h1>
            <p class="text-md text-center">
              {$landingPageSettings.courses.subtitle}
            </p>
            <div class="mt-5 flex justify-center">
              <Button.Root variant="link" class="w-fit px-8 py-4" onclick={() => goto(resolve('/courses', {}))}>
                {$t('course.navItem.landing_page.view_all')}
              </Button.Root>
            </div>
          </div>
        </div>
        {#if orgApi.isFetchingOrgPublicCourses}
          <div class="cards-container mx-2 my-4">
            <CourseCardLoader />
            <CourseCardLoader />
            <CourseCardLoader />
          </div>
        {:else if orgApi.publicCourses.length > 0}
          <CourseCardList courses={orgApi.publicCourses.slice(0, 3)} isOnLandingPage={true} />
        {:else}
          <Empty
            icon={CoursesEmptyIcon}
            title={$t('course.navItem.landing_page.no_course_published')}
            description={$t('course.navItem.landing_page.coming_your_way')}
            variant="page"
          />
        {/if}
      </section>
    {/if}

    <!-- FAQ Section -->
    {#if $landingPageSettings.faq.show}
      <section id="faq" transition:fade class="mx-auto my-10 w-full max-w-[700px]">
        <div class="py-10">
          <h1 class="my-4 text-center text-4xl md:text-5xl lg:text-6xl">
            {$landingPageSettings.faq.title}
          </h1>
        </div>
        <div class="mx-2">
          <Accordion.Root type="single" class="w-full">
            {#each $landingPageSettings.faq.questions as faq, index}
              <Accordion.Item value="item-{index}">
                <Accordion.Trigger>
                  {faq.title}
                </Accordion.Trigger>
                <Accordion.Content>
                  {faq.content}
                </Accordion.Content>
              </Accordion.Item>
            {/each}
          </Accordion.Root>
        </div>
      </section>
    {/if}

    <!-- Contact Section-->
    {#if $landingPageSettings.contact.show}
      <section id="contact" transition:fade class="ui:bg-primary-foreground my-10 w-full">
        <div class="mx-auto w-full max-w-6xl">
          <div class="mx-auto w-11/12 max-w-[500px] py-10">
            <h1 class="my-4 text-center text-4xl md:text-5xl lg:text-6xl">
              {$landingPageSettings.contact.title}
              <span class="ui:text-primary">{$landingPageSettings.contact.titleHighlight}</span>
            </h1>
            <p class="text-md text-center">{$landingPageSettings.contact.subtitle}</p>
          </div>
          <div class="mx-auto max-w-[700px] pb-10">
            <!-- Contact Details -->
            <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div
                class="mx-2 flex cursor-pointer flex-col items-center justify-center rounded-lg border py-2 text-center break-all transition-all duration-500"
              >
                <MapPinIcon size={16} class="filled" />
                <p class="mt-3 max-w-[200px] text-xs md:text-sm">
                  {$landingPageSettings.contact.address}
                </p>
              </div>
              <div
                class="mx-2 flex cursor-pointer flex-col items-center justify-center rounded-lg border py-2 text-center break-all transition-all duration-500"
              >
                <PhoneIcon size={16} />
                <p class="mt-3 text-xs md:text-sm">{$landingPageSettings.contact.phone}</p>
              </div>
              <div
                class="mx-2 flex cursor-pointer flex-col items-center justify-center rounded-lg border py-2 text-center break-all transition-all duration-500"
              >
                <MailIcon size={16} />
                <p class="mt-3 text-xs md:text-sm">{$landingPageSettings.contact.email}</p>
              </div>
            </div>

            <!-- Contact Form -->
            <div class="mt-8 rounded-lg bg-white p-7">
              {#if successContactSaved}
                <div class="flex w-full items-center justify-center">
                  {$t('course.navItem.landing_page.thank_you')}
                </div>
              {:else}
                <form onsubmit={preventDefault(handleContactSubmit)}>
                  <div class="flex w-full flex-col justify-between md:flex-row">
                    <div class="mr-5 w-full md:w-2/4">
                      <Field.Field class="mb-5">
                        <Field.Label class="font-bold">
                          {$t('course.navItem.landing_page.name')}
                        </Field.Label>
                        <Input bind:value={contact.name} placeholder="Elon Musk" aria-invalid={!!contactError.name} />
                        {#if contactError.name}
                          <Field.Error>{contactError.name}</Field.Error>
                        {/if}
                      </Field.Field>
                      <Field.Field class="mb-5">
                        <Field.Label class="text-xs font-normal">
                          {$t('course.navItem.landing_page.email')}
                        </Field.Label>
                        <Input
                          bind:value={contact.email}
                          type="email"
                          placeholder="musk@x.com"
                          aria-invalid={!!contactError.email}
                        />
                        {#if contactError.email}
                          <Field.Error>{contactError.email}</Field.Error>
                        {/if}
                      </Field.Field>
                      <Field.Field class="mb-5">
                        <Field.Label class="text-xs font-normal">
                          {$t('course.navItem.landing_page.phone')}
                        </Field.Label>
                        <Input
                          bind:value={contact.phone}
                          placeholder="+1194802480"
                          aria-invalid={!!contactError.phone}
                        />
                        {#if contactError.phone}
                          <Field.Error>{contactError.phone}</Field.Error>
                        {/if}
                      </Field.Field>
                    </div>
                    <div class="w-full md:w-2/4">
                      <Field.Field>
                        <Field.Label>
                          {$t('course.navItem.landing_page.message')}
                        </Field.Label>
                        <Textarea
                          bind:value={contact.message}
                          rows={9}
                          placeholder={$t('course.navItem.landing_page.your_message')}
                          aria-invalid={!!contactError.message}
                        />
                        {#if contactError.message}
                          <Field.Error>{contactError.message}</Field.Error>
                        {/if}
                      </Field.Field>
                    </div>
                  </div>

                  <Button.Root class="mx-auto mt-5 w-full md:mt-0" type="submit" loading={isContactSubmiting}>
                    <span class="text-md mr-2">{$t('course.navItem.landing_page.submit')}</span>
                    <RocketIcon size={16} class="custom" />
                  </Button.Root>
                </form>
              {/if}
            </div>
          </div>
        </div>
      </section>
    {/if}

    <!-- Waitlist Section -->
    {#if $landingPageSettings.mailinglist.show}
      <section id="waitlist" transition:fade class="mx-auto my-10 w-[95%] max-w-6xl">
        <div class="ui:bg-primary gap-4 rounded-lg px-4 py-14 md:px-10 lg:flex-row lg:items-center">
          <div class="mx-auto flex max-w-[700px] flex-col lg:flex-row lg:items-center lg:justify-between">
            <div class="w-3/5">
              <h1 class="mt-0 mb-5 text-4xl text-white">
                {$landingPageSettings.mailinglist.title}
              </h1>
              <p class="text-md text-white">
                {$landingPageSettings.mailinglist.subtitle}
              </p>
            </div>
            <form onsubmit={preventDefault(handleSubmit)}>
              <div class="flex max-w-60 flex-col items-center">
                {#if success}
                  <p class="text-white">{$t('course.navItem.landing_page.successful_sub')}</p>
                {:else}
                  <Input
                    bind:value={email}
                    type="email"
                    placeholder={$t('course.navItem.landing_page.enter')}
                    required={true}
                    disabled={isAdding}
                  />
                  <Button.Root class="my-1 mt-2 w-full" variant="outline" type="submit" loading={isAdding}>
                    {$landingPageSettings.mailinglist.buttonLabel}
                  </Button.Root>
                {/if}
              </div>
            </form>
          </div>
        </div>
      </section>
    {/if}

    <!-- Footer Section -->

    {#if $landingPageSettings.footer.show}
      <footer
        id="footer"
        class="my-10 flex w-full flex-col items-center justify-center border-t border-r-0 border-b-0 border-l-0 border-gray-300 px-5 py-10 md:py-3"
      >
        <ul class="flex w-11/12 flex-col items-center sm:flex-row">
          <div class="logo">
            <a href="/" title={`Go to ${org.name} Home`} id="logo" data-hveid="8" class="flex items-center">
              <img
                src={org.avatarUrl || '/logo-192.png'}
                alt={`${org.name} logo`}
                class="mx-auto inline-block max-h-10 w-10 rounded"
                data-atf="1"
              />
              <h3 class="ml-3 text-xl text-black">{org.name}</h3>
            </a>
          </div>

          <span class="flex-grow"></span>

          <div class="mt-5 flex gap-2 sm:mt-0">
            {#if $landingPageSettings.footer.facebook}
              <li>
                <a
                  href={$landingPageSettings.footer.facebook}
                  target="_blank"
                  title={$t('settings.landing_page.footer.facebook')}
                  id="logo-fb"
                  data-hveid="8"
                >
                  <FacebookIcon size={16} />
                </a>
              </li>
            {/if}
            {#if $landingPageSettings.footer.twitter}
              <li>
                <a
                  href={$landingPageSettings.footer.twitter}
                  target="_blank"
                  title={$t('settings.landing_page.footer.twitter')}
                  id="logo-tw"
                  data-hveid="8"
                >
                  <TwitterIcon size={16} />
                </a>
              </li>
            {/if}

            {#if $landingPageSettings.footer.linkedin}
              <li>
                <a
                  href={$landingPageSettings.footer.linkedin}
                  target="_blank"
                  title={$t('settings.landing_page.footer.linkedin')}
                  id="logo-ln"
                  data-hveid="8"
                >
                  <LinkedinIcon size={16} />
                </a>
              </li>
            {/if}
          </div>
        </ul>
      </footer>
    {/if}
  </main>
{/if}
