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
  import PageLoader from '$lib/components/Org/LandingPage/PageLoader.svelte';
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
  import { validateEmail } from '$lib/utils/functions/validateEmail';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import { goto } from '$app/navigation';
  import { landingPageSettings } from '$lib/components/Org/Settings/store';
  import { t } from '$lib/utils/functions/translations';
  import PoweredBy from '$lib/components/Upgrade/PoweredBy.svelte';
  import Hero from './components/Hero.svelte';
  import AboutUs from './components/AboutUs.svelte';
  import Courses from './components/Courses.svelte';
  import FAQ from './components/FAQ.svelte';
  import ContactUs from './components/ContactUs.svelte';
  import Mailing from './components/Mailing.svelte';
  import Footer from './components/Footer.svelte';

  export let orgSiteName = '';
  export let org = {};

  let email: string | undefined;
  let isAdding = false;
  let success = false;
  let successContactSaved = false;
  let viewAll = false;
  let isContactSubmiting = false;
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

  $: loadData(orgSiteName);

  async function loadData(siteName) {
    if (!siteName) return;

    try {
      console.log('sitename', siteName);
      $courseMetaDeta.isLoading = true;
      const coursesResult = await getCourseBySiteName(siteName);
      courses.set(coursesResult);
      $courseMetaDeta.isLoading = false;
    } catch (error) {
      console.log('error', error);
    }
  }
</script>

<PoweredBy />
<main>
  <!-- Header Section -->
  {#if $landingPageSettings.header.show}
    <header id="header" class="banner w-full h-[100vh] md:h-[90vh] mb-10 relative">
      <Navigation logo={org.avatar_url} orgName={org.name} disableSignup={true} isOrgSite={true} />

      <div class="absolute h-[100vh] md:h-[90vh] top-0 w-full opacity-80 z-10 bg-white" />
      <Hero {org} />
    </header>
  {/if}

  <!-- Our Story section -->
  <AboutUs />

  <!-- Courses Section -->
  <Courses />

  <!-- FAQ Section -->
  <FAQ />

  <!-- Contact Section-->
  <ContactUs
    {contact}
    {contactError}
    {handleContactSubmit}
    {successContactSaved}
    {isContactSubmiting}
  />

  <!-- Waitlist Section -->
  <Mailing {email} {success} {isAdding} {handleSubmit} />
  <!-- Footer Section -->
  <Footer {org} />
</main>

<style>
  .banner {
    background: url('/images/org-landingpage-banner.jpeg') no-repeat center center fixed;
    -webkit-background-size: cover;
    -moz-background-size: cover;
    -o-background-size: cover;
    background-size: cover;
  }
</style>
