<script lang="ts">
  import { fade } from 'svelte/transition';
  import get from 'lodash/get';
  import { onMount } from 'svelte';
  import LogoFacebook from 'carbon-icons-svelte/lib/LogoFacebook.svelte';
  import LogoTwitter from 'carbon-icons-svelte/lib/LogoTwitter.svelte';
  import LogoLinkedin from 'carbon-icons-svelte/lib/LogoLinkedin.svelte';
  import { Accordion, AccordionItem, Grid, Row, Column } from 'carbon-components-svelte';
  import LocationFilled from 'carbon-icons-svelte/lib/LocationFilled.svelte';
  import Phone from 'carbon-icons-svelte/lib/Phone.svelte';
  import Email from 'carbon-icons-svelte/lib/Email.svelte';
  import Rocket from 'carbon-icons-svelte/lib/Rocket.svelte';
  import PageLoader from './PageLoader.svelte';
  import { orgLandingpageValidation } from '$lib/utils/functions/validator';
  import TextField from '$lib/components/Form/TextField.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import Navigation from '$lib/components/Navigation/index.svelte';
  import Box from '$lib/components/Box/index.svelte';
  import Card from '$lib/components/Courses/components/Card/index.svelte';
  import CardLoader from '$lib/components/Courses/components/Card/Loader.svelte';
  import CoursesEmptyIcon from '$lib/components/Icons/CoursesEmptyIcon.svelte';
  import { getSupabase } from '$lib/utils/functions/supabase';
  import { courses, courseMetaDeta } from '$lib/components/Courses/store';
  import { getCourseBySiteName } from '$lib/utils/services/org';
  import { currentOrg } from '$lib/utils/store/org';
  import { validateEmail } from '$lib/utils/functions/validateEmail';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import { goto } from '$app/navigation';
  import { landingPageSettings } from '$lib/components/Org/Settings/store';
  import { t } from '$lib/utils/functions/translations';

  export let orgSiteName = '';
  export let org = {};

  let email: string | undefined;
  let isAdding = false;
  let success = false;
  let successContactSaved = false;
  let viewAll = false;
  let isContactSubmiting = false;
  let player;
  let contact = {
    name: '',
    email: '',
    phone: '',
    message: ''
  };
  let contactError = {};

  const supabase = getSupabase();

  async function handleSubmit() {
    if (!email || !validateEmail(email)) return;
    isAdding = true;

    const { error } = await supabase.from('organization_emaillist').insert({
      email,
      organization_id: org.id
    });

    if (error) {
      console.error('Error', error);
    }

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
    const { error } = await supabase.from('organization_contacts').insert({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      message: contact.message,
      organization_id: org.id
    });

    if (error) {
      console.error('Something went wrong', error, '\n\nContact', contact);
      isContactSubmiting = false;
    }

    isContactSubmiting = false;
    successContactSaved = true;
    contact = {
      name: '',
      email: '',
      phone: '',
      message: ''
    };
  }
  function isYouTubeLink(link: string) {
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

    return youtubeRegex.test(link.trim());
  }

  onMount(async () => {
    if (!orgSiteName) return;
    try {
      console.log('sitename', orgSiteName);
      $courseMetaDeta.isLoading = true;
      const coursesResult = await getCourseBySiteName(orgSiteName);
      courses.set(coursesResult);
      $courseMetaDeta.isLoading = false;
    } catch (error) {
      console.log('error', error);
    }
  });
  function initPlyr(_player: any, _video: string | undefined) {
    if (!player) return;

    // @ts-ignore
    const plyr = new Plyr('#player', { width: '400px', height: '300px', borderRadius: '10px' });
    // @ts-ignore
    window.player = plyr;
  }

  // Use default data in store if user hasn't added their own content to landing page
  function setDefault(landingpage) {
    if (landingpage && Object.keys(landingpage).length) {
      if (!landingpage?.header?.banner) {
        landingpage.header.banner = $landingPageSettings.header.banner;
      }

      $landingPageSettings = {
        ...landingpage
      };
    }
  }

  $: initPlyr(player, $landingPageSettings.header?.banner?.video);
  $: setDefault(org.landingpage);
</script>

<svelte:head>
  <title>
    {!org.name ? '' : `${org.name}'s `}{$t('course.navItem.landing_page.landing_page')}
  </title>
</svelte:head>

{#if !org.landingpage}
  <PageLoader />
{:else}
  <main>
    <!-- Header Section -->
    {#if $landingPageSettings.header.show}
      <header id="header" class="banner w-full h-[100vh] md:h-[90vh] mb-10 relative">
        <Navigation logo={org.avatar_url} orgName={org.name} disableSignup={true} />
        <div class="absolute h-[100vh] md:h-[90vh] top-0 w-full opacity-80 z-10 bg-white" />
        {#if $landingPageSettings.header.banner.show}
          <div class="flex items-center justify-center md:h-full py-2">
            <div
              class="md:w-11/12 lg:w-5/6 w-full flex items-center justify-center md:justify-between flex-col-reverse md:flex-row z-20 relative"
            >
              <!-- Course Description -->
              <div class="md:w-2/5 w-11/12 py-10 flex flex-col items-center md:items-start mr-3">
                <p class=" text-primary-600 text-2xl font-semibold capitalize">
                  {org.name}
                </p>
                <h1
                  class="text-4xl md:text-5xl lg:text-6xl text-center md:text-start my-4 font-bold"
                >
                  {$landingPageSettings.header.title} <br /><span class="text-primary-600"
                    >{$landingPageSettings.header.titleHighlight}</span
                  >
                </h1>
                <p class="text-md mb-3 md:mb-5 text-xl text-center md:text-start">
                  {$landingPageSettings.header.subtitle}
                </p>

                <PrimaryButton
                  label={$landingPageSettings.header.action.label}
                  className="mt-2 md:mt-5 px-10 w-fit"
                  onClick={() => {
                    $landingPageSettings.header.action.redirect &&
                      goto($landingPageSettings.header.action.link);
                  }}
                />
              </div>

              <div class="w-5/6 md:w-1/2 md:max-w-[650px] flex">
                {#if isYouTubeLink($landingPageSettings.header?.banner?.video) && $landingPageSettings.header.banner.type === 'video'}
                  <div bind:this={player} id="player" style="width:100%; border-radius:12px">
                    <iframe
                      title={$t('course.navItem.landing_page.header_video')}
                      src={$landingPageSettings.header?.banner?.video}
                      allowfullscreen
                      allowtransparency
                      allow="autoplay"
                    />
                  </div>
                {:else}
                  <!-- <video class="w-full rounded-xl" controls loop autoplay>
                      <source src={$landingPageSettings.header?.banner?.video} type="video/mp4" />
                      <source src="/path/to/video.webm" type="video/webm" />
                      Captions are optional
                      <track kind="captions" />
                    </video> -->
                  <img
                    class="rounded-md"
                    src={$landingPageSettings.header?.banner?.image}
                    alt="landing page banner"
                  />
                {/if}
              </div>
            </div>
          </div>
        {:else}
          <div class="w-full h-full flex items-center justify-center md:flex-row z-20 relative">
            <div class="max-w-[600px] mx-auto w-11/12 py-10 flex flex-col items-center">
              <p class=" text-primary-600 text-2xl font-semibold capitalize">{org.name}</p>
              <h1 class="text-4xl md:text-5xl lg:text-6xl text-center my-4 font-bold">
                {$landingPageSettings.header.title} <br /><span class="text-primary-600"
                  >{$landingPageSettings.header.titleHighlight}</span
                >
              </h1>
              <p class="text-md mb-6 text-center text-xl">
                {$landingPageSettings.header.subtitle}
              </p>

              <PrimaryButton
                label={$landingPageSettings.header.action.label}
                className="mt-5 px-10 w-fit"
                onClick={() => {
                  $landingPageSettings.header.action.redirect &&
                    goto($landingPageSettings.header.action.link);
                }}
              />
            </div>
          </div>
        {/if}
      </header>
    {/if}

    <!-- Our Story section -->
    {#if $landingPageSettings.aboutUs.show}
      <section id="aboutus" class="m-h-[400px] my-10 mx-auto max-w-6xl w-full">
        <div class="mx-4 flex items-center justify-evenly flex-col lg:flex-row">
          <div class="max-w-[600px] lg:w-2/5 mr-5 mb-5 lg:mb-0">
            <h2 class="text-4xl md:text-5xl lg:text-6xl">{$landingPageSettings.aboutUs.title}</h2>
            <p class="mb-2">
              {$landingPageSettings.aboutUs.content}
            </p>
          </div>

          <div class="image">
            <img
              src={$landingPageSettings.aboutUs.imageUrl}
              alt="Our Story"
              class=" rounded-2xl max-h-[450px]"
            />
          </div>
        </div>
      </section>
    {/if}

    <!-- Courses Section -->
    {#if $landingPageSettings.courses.show}
      <section id="courses" transition:fade class="my-10 mx-auto max-w-6xl w-full">
        <div class="w-full">
          <div class="max-w-[500px] mx-auto w-11/12 py-10">
            <h1 class="text-4xl md:text-5xl lg:text-6xl text-center my-4 font-bold">
              {$landingPageSettings.courses.title}
              <span class="text-primary-600">{$landingPageSettings.courses.titleHighlight}</span>
            </h1>
            <p class="text-md text-center">
              {$landingPageSettings.courses.subtitle}
            </p>
          </div>
        </div>
        {#if $courseMetaDeta.isLoading}
          <div class="cards-container my-4 mx-2">
            <CardLoader />
            <CardLoader />
            <CardLoader />
          </div>
        {:else if $courses.length > 0}
          <div class="cards-container my-4 mx-2">
            {#each $courses.slice(0, viewAll ? $courses.length : 3) as courseData}
              <Card
                id={courseData.id}
                slug={courseData.slug}
                bannerImage={courseData.logo || '/images/classroomio-course-img-template.jpg'}
                title={courseData.title}
                description={courseData.description}
                role_id={courseData.role_id}
                isPublished={courseData.is_published}
                cost={courseData.cost}
                currency={courseData.currency}
                totalLessons={get(courseData, 'lessons[0].count', 0)}
                isOnLandingPage={true}
              />
            {/each}
          </div>
        {:else}
          <Box>
            <CoursesEmptyIcon />
            <h3 class="dark:text-white text-2xl my-5">
              {$t('course.navItem.landing_page.no_course_published')}
            </h3>
            <p class="dark:text-white w-1/3 text-center">
              {$t('course.navItem.landing_page.coming_your_way')}
            </p>
          </Box>
        {/if}

        {#if $courses.length > 3}
          <div class="w-full mt-3 flex justify-center">
            <PrimaryButton
              variant={VARIANTS.OUTLINED}
              onClick={() => (viewAll = !viewAll)}
              label={viewAll
                ? $t('course.navItem.landing_page.view_less')
                : $t('course.navItem.landing_page.view_all')}
              className="px-10 py-5 w-fit"
            />
          </div>
        {/if}
      </section>
    {/if}

    <!-- FAQ Section -->
    {#if $landingPageSettings.faq.show}
      <section id="faq" transition:fade class="my-10 mx-auto max-w-[700px] w-full">
        <div class="py-10">
          <h1 class="text-4xl md:text-5xl lg:text-6xl text-center my-4 font-bold">
            {$landingPageSettings.faq.title}
          </h1>
        </div>
        <div class="mx-2">
          <Accordion size="xl">
            {#each $landingPageSettings.faq.questions as faq}
              <AccordionItem title={faq.title} class="text-3xl">
                <p class="text-lg">
                  {faq.content}
                </p>
              </AccordionItem>
            {/each}
          </Accordion>
        </div>
      </section>
    {/if}

    <!-- Contact Section-->
    {#if $landingPageSettings.contact.show}
      <section id="contact" transition:fade class="my-10 w-full bg-primary-50">
        <div class="mx-auto max-w-6xl w-full">
          <div class="max-w-[500px] mx-auto w-11/12 py-10">
            <h1 class="text-4xl md:text-5xl lg:text-6xl text-center my-4 font-bold">
              {$landingPageSettings.contact.title}
              <span class="text-primary-600">{$landingPageSettings.contact.titleHighlight}</span>
            </h1>
            <p class="text-md text-center">{$landingPageSettings.contact.subtitle}</p>
          </div>
          <Grid class="max-w-[700px] pb-10">
            <!-- Contact Details -->
            <Row>
              <Column
                class="flex items-center flex-col justify-center break-all text-center cursor-pointer hover:shadow-xl rounded-lg transition-all duration-500 py-2 mx-2"
              >
                <LocationFilled size={32} />
                <p class="text-xs md:text-sm mt-3 max-w-[200px]">
                  {$landingPageSettings.contact.address}
                </p>
              </Column>
              <Column
                class="flex items-center flex-col justify-center break-all text-center cursor-pointer hover:shadow-xl rounded-lg transition-all duration-500 py-2 mx-2"
              >
                <Phone size={32} />
                <p class="text-xs md:text-sm mt-3">{$landingPageSettings.contact.phone}</p>
              </Column>
              <Column
                class="flex items-center flex-col justify-center break-all text-center cursor-pointer hover:shadow-xl rounded-lg transition-all duration-500 py-2 mx-2"
              >
                <Email size={32} />
                <p class="text-xs md:text-sm mt-3">{$landingPageSettings.contact.email}</p>
              </Column>
            </Row>

            <!-- Contact Form -->
            <div class="mt-8 bg-white p-7 rounded-lg">
              {#if successContactSaved}
                <div class="w-full flex items-center justify-center">
                  {$t('course.navItem.landing_page.thank_you')}
                </div>
              {:else}
                <form on:submit|preventDefault={handleContactSubmit}>
                  <div class="w-full flex justify-between flex-col md:flex-row">
                    <div class="w-full md:w-2/4 mr-5">
                      <TextField
                        label={$t('course.navItem.landing_page.name')}
                        bind:value={contact.name}
                        errorMessage={contactError.name}
                        className="mb-5"
                        labelClassName="font-bold"
                        placeholder="Elon Musk"
                      />
                      <TextField
                        label={$t('course.navItem.landing_page.email')}
                        bind:value={contact.email}
                        errorMessage={contactError.email}
                        className="text-xs font-normal mb-5"
                        placeholder="musk@x.com"
                      />
                      <TextField
                        label={$t('course.navItem.landing_page.phone')}
                        bind:value={contact.phone}
                        errorMessage={contactError.phone}
                        className="text-xs font-normal mb-5"
                        placeholder="+1194802480"
                      />
                    </div>
                    <div class="w-full md:w-2/4">
                      <TextArea
                        label={$t('course.navItem.landing_page.message')}
                        bind:value={contact.message}
                        errorMessage={contactError.message}
                        rows="9"
                        maxRows={15}
                        placeholder={$t('course.navItem.landing_page.your_message')}
                      />
                    </div>
                  </div>

                  <PrimaryButton
                    className="w-full mx-auto mt-5 md:mt-0"
                    type="submit"
                    isLoading={isContactSubmiting}
                  >
                    <span class="mr-2 text-md">{$t('course.navItem.landing_page.submit')}</span>
                    <Rocket size={24} />
                  </PrimaryButton>
                </form>
              {/if}
            </div>
          </Grid>
        </div>
      </section>
    {/if}

    <!-- Waitlist Section -->
    {#if $landingPageSettings.mailinglist.show}
      <section id="waitlist" transition:fade class="my-10 mx-auto max-w-6xl w-[95%]">
        <div
          class="bg-primary-700 rounded-lg flex flex-col lg:flex-row lg:items-center px-4 md:px-10 py-14"
        >
          <div class="w-full md:w-[65%] md:mr-4">
            <h1 class="text-4xl font-bold mb-5 mt-0 text-white">
              {$landingPageSettings.mailinglist.title}
            </h1>
            <p class="text-lg text-white">
              {$landingPageSettings.mailinglist.subtitle}
            </p>
          </div>
          <form on:submit|preventDefault={handleSubmit} class="my-4 w-full md:w-fit">
            <div class="flex items-center flex-col sm:flex-row">
              {#if success}
                <p class="text-white">{$t('course.navItem.landing_page.successful_sub')}</p>
              {:else}
                <TextField
                  bind:value={email}
                  type="email"
                  placeholder={$t('course.navItem.landing_page.enter')}
                  className="sm:mr-3 my-0 w-full md:w-fit"
                  isRequired={true}
                  isDisabled={isAdding}
                  inputClassName="py-2"
                />
                <PrimaryButton
                  className="my-1 w-full mt-2"
                  variant={VARIANTS.CONTAINED_LIGHT}
                  type="submit"
                  isLoading={isAdding}>{$landingPageSettings.mailinglist.buttonLabel}</PrimaryButton
                >
              {/if}
            </div>
          </form>
        </div>
      </section>
    {/if}

    <!-- Footer Section -->

    {#if $landingPageSettings.footer.show}
      <footer
        id="footer"
        class="flex justify-center flex-col mt-10 w-full px-5 py-10 md:py-3 border-b-0 border-r-0 border-t border-l-0 border-gray-300"
      >
        <ul class="flex w-11/12 items-center flex-col sm:flex-row">
          <div class="logo">
            <a
              href="/"
              title={`Go to ${org.name} Home`}
              id="logo"
              data-hveid="8"
              class="flex items-center"
            >
              <img
                src={org.avatar_url || '/logo-192.png'}
                alt={`${org.name} logo`}
                class="rounded h-10 w-10 inline-block mx-auto"
                data-atf="1"
              />
              <h3 class="text-black ml-3 text-xl">{org.name}</h3>
            </a>
          </div>

          <span class="flex-grow" />

          <div class="flex mt-5 sm:mt-0">
            {#if $landingPageSettings.footer.facebook}
              <li class="mx-2">
                <a
                  href={$landingPageSettings.footer.facebook}
                  target="_blank"
                  title={$t('settings.landing_page.footer.facebook')}
                  id="logo-fb"
                  data-hveid="8"
                >
                  <LogoFacebook size={24} />
                </a>
              </li>
            {/if}
            {#if $landingPageSettings.footer.twitter}
              <li class="mx-2">
                <a
                  href={$landingPageSettings.footer.twitter}
                  target="_blank"
                  title={$t('settings.landing_page.footer.twitter')}
                  id="logo-tw"
                  data-hveid="8"
                >
                  <LogoTwitter size={24} />
                </a>
              </li>
            {/if}

            {#if $landingPageSettings.footer.linkedin}
              <li class="mx-2">
                <a
                  href={$landingPageSettings.footer.linkedin}
                  target="_blank"
                  title={$t('settings.landing_page.footer.linkedin')}
                  id="logo-ln"
                  data-hveid="8"
                >
                  <LogoLinkedin size={24} />
                </a>
              </li>
            {/if}
          </div>
        </ul>
        <p class="text-center mt-5">
          {$t('course.navItem.landing_page.powered_by')}
          <a class="text-primary-600 underline" href="https://classroomio.com" target="_blank"
            >ClassroomIO</a
          >
        </p>
      </footer>
    {/if}
  </main>
{/if}

<style>
  .banner {
    background: url('/images/org-landingpage-banner.jpeg') no-repeat center center fixed;
    -webkit-background-size: cover;
    -moz-background-size: cover;
    -o-background-size: cover;
    background-size: cover;
  }
</style>
