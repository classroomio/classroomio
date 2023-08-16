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

  export let orgSiteName = '';

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
  let video =
    'https://koxqonvbkeakwvmdegcf.supabase.co/storage/v1/object/public/avatars/course/About%20Best.mp4';

  const supabase = getSupabase();

  const faqs = [
    {
      title: 'What sets your bootcamp apart from other online resources?',
      content:
        'Our bootcamp offers a structured and guided learning experience led by industry professionals who have a deep understanding of current web development trends and technologies. Unlike self-paced online tutorials, our program provides a hands-on, immersive environment with real-time feedback, personalized guidance, and the opportunity to work on practical projects that mirror real-world scenarios, preparing you for a successful career in web development.'
    },
    {
      title: 'Who is this bootcamp suitable for?',
      content:
        "Our web technologies bootcamp is suitable for individuals of all skill levels, from beginners with no prior coding experience to intermediate learners looking to enhance their web development capabilities. Whether you're a career changer, a recent graduate, or a professional aiming to upskill, our program is tailored to help you succeed."
    },
    {
      title: 'How is the bootcamp structured?',
      content:
        "Our web technologies bootcamp typically spans a [X]-week period and is divided into modules that cover different aspects of web development. Each module consists of lectures, hands-on coding exercises, projects, and collaborative activities. Our experienced instructors provide guidance and support, and you'll have access to a community of fellow learners to foster collaboration and knowledge sharing."
    }
  ];

  async function handleSubmit() {
    if (!email || !validateEmail(email)) return;
    isAdding = true;

    const { error } = await supabase.from('organization_emaillist').insert({
      email,
      organization_id: $currentOrg.id
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
      return;
    }

    // Save to db
    const { error } = await supabase.from('organization_contacts').insert({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      message: contact.message,
      organization_id: $currentOrg.id
    });

    if (error) {
      console.error('Something went wrong', error, '\n\nContact', contact);
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
</script>

<svelte:head>
  {$currentOrg.name}
</svelte:head>

<main>
  <!-- Header Section -->
  <header id="header" class="banner w-full h-[80vh] mb-10 relative">
    <Navigation logo={$currentOrg.avatar_url} orgName={$currentOrg.name} disableLogin={false} />
    <div class="absolute h-[80vh] top-0 w-full opacity-80 z-10 bg-white" />

    {#if video}
      <div class="flex items-center justify-center">
        <div
          class="md:w-11/12 lg:w-5/6 w-full flex items-center justify-between flex-col-reverse md:flex-row z-20 relative"
        >
          <!-- Course Description -->
          <div class="md:w-2/5 w-11/12 py-10 flex flex-col items-start">
            <p class=" text-blue-600 text-2xl font-semibold">Coding Dojo</p>
            <h1 class="text-4xl md:text-5xl lg:text-6xl my-4 font-bold">
              Web Developement Courses for <br /><span class="text-blue-600">Everyone</span>
            </h1>
            <p class="text-md mb-6 text-xl">
              Practical project-based courses that are easy to understand and straight to the point
              with NO FLUFF
            </p>

            <PrimaryButton
              label="Start Learning Today"
              className="mt-5 px-10 w-fit"
              onClick={() => goto('#contact')}
            />
          </div>
          <div class="w-4/6 md:w-2/3 md:max-w-[650px] flex">
            <video class="w-full rounded-xl" controls loop autoplay>
              <source src={video} type="video/mp4" />
              <!-- <source src="/path/to/video.webm" type="video/webm" /> -->
              <!-- Captions are optional -->
              <track kind="captions" />
            </video>
          </div>
        </div>
      </div>
    {:else}
      <div class="w-full h-full flex items-center justify-center md:flex-row z-20 relative">
        <div class="max-w-[600px] mx-auto w-11/12 py-10 flex flex-col items-center">
          <p class=" text-blue-600 text-2xl font-semibold">Coding Dojo</p>
          <h1 class="text-4xl md:text-6xl text-center my-4 font-bold">
            Web Developement Courses for <br /><span class="text-blue-600">Everyone</span>
          </h1>
          <p class="text-md mb-6 text-center text-xl">
            Practical project-based courses that are easy to understand and straight to the point
            with NO FLUFF
          </p>

          <PrimaryButton
            label="Start Learning Today"
            className="mt-5 px-10 w-fit"
            onClick={() => goto('#contact')}
          />
        </div>
      </div>
    {/if}
  </header>

  <!-- Our Story section -->
  <section id="aboutus" class="m-h-[400px] my-10 mx-auto max-w-6xl w-full">
    <div class="mx-4 flex items-center justify-between flex-col lg:flex-row">
      <div class="max-w-[600px] lg:w-2/5 mr-5 mb-5 lg:mb-0">
        <h2 class="text-6xl">Our Story</h2>
        <p class="mb-2">
          Lorem ipsum dolor sit, amet consectetur adipisicing elit. Repudiandae, quaerat cum. Ullam
          similique quae dicta ipsum atque quam fugit iusto eligendi magni voluptatum aut,
          exercitationem deserunt vitae iste rem sunt! <br /> Lorem ipsum, dolor sit amet consectetur
          adipisicing elit. Maiores obcaecati veritatis tenetur in, nihil repellat quasi cumque sed molestias
          id reiciendis harum doloremque minus fugit quia cum dolores quas pariatur.
        </p>
      </div>

      <div class="image">
        <img
          src="images/org-landingpage-our-story.jpeg"
          alt="Our Story"
          class=" rounded-2xl w-[600px]"
        />
      </div>
    </div>
  </section>

  <!-- Courses Section -->
  <section id="courses" transition:fade class="my-10 mx-auto max-w-6xl w-full">
    <div class="w-full">
      <div class="max-w-[500px] mx-auto w-11/12 py-10">
        <h1 class="text-5xl text-center my-4 font-bold">
          Explore our <span class="text-blue-600">Courses</span>
        </h1>
        <p class="text-md text-center">
          Find courses you will love from best teachers all over the world🌎.
        </p>
      </div>
    </div>
    <div class="flex gap-5 items-center justify-center flex-wrap my-4 mx-2">
      {#if $courseMetaDeta.isLoading}
        <CardLoader />
        <CardLoader />
        <CardLoader />
      {:else}
        {#each $courses.slice(0, viewAll ? $courses.length : 3) as courseData}
          <Card
            id={courseData.id}
            slug={courseData.slug}
            bannerImage={courseData.banner_image}
            title={courseData.title}
            description={courseData.description}
            role_id={courseData.role_id}
            isPublished={courseData.is_published}
            cost={courseData.cost}
            currency={courseData.currency}
            totalLessons={get(courseData, 'lessons[0].count', 0)}
            isOnLandingPage={true}
          />
        {:else}
          <Box>
            <CoursesEmptyIcon />
            <h3 class="dark:text-white text-2xl my-5">No Course Published</h3>
            <p class="dark:text-white w-1/3 text-center">
              We've got great courses coming your way, stay tuned!!!
            </p>
          </Box>
        {/each}
      {/if}
    </div>

    {#if $courses.length > 3}
      <div class="w-full flex justify-center">
        <PrimaryButton
          variant={VARIANTS.OUTLINED}
          onClick={() => (viewAll = !viewAll)}
          label={viewAll ? 'View Less' : 'View All'}
          className="px-10 py-5 w-fit"
        />
      </div>
    {/if}
  </section>

  <!-- FAQ Section -->
  <section id="faq" transition:fade class="my-10 mx-auto max-w-[700px] w-full">
    <div class="py-10">
      <h1 class="text-5xl text-center my-4 font-bold">Frequently Asked Questions.</h1>
    </div>
    <div class="mx-2">
      <Accordion size="xl">
        {#each faqs as faq}
          <AccordionItem title={faq.title} class="text-3xl">
            <p class="text-lg">
              {faq.content}
            </p>
          </AccordionItem>
        {/each}
      </Accordion>
    </div>
  </section>

  <!-- Contact Section-->
  <section id="contact" transition:fade class="my-10 w-full bg-blue-50">
    <div class="mx-auto max-w-6xl w-full">
      <div class="max-w-[500px] mx-auto w-11/12 py-10">
        <h1 class="text-5xl text-center my-4 font-bold">
          Have you got any <span class="text-blue-600">Question?</span>
        </h1>
        <p class="text-md text-center">Reach out to us with any question you might have.</p>
      </div>
      <Grid class="max-w-[700px] pb-10">
        <!-- Contact Details -->
        <Row>
          <Column
            class="flex items-center flex-col justify-center break-all text-center cursor-pointer hover:shadow-xl rounded-lg transition-all duration-500 py-2 mx-2"
          >
            <LocationFilled size={32} />
            <p class="text-xs md:text-sm mt-3 max-w-[200px]">
              Ashwoodfield House Farm, Kidderminster Rd, Stourbridge, Kingswinford DY6 0AA
            </p>
          </Column>
          <Column
            class="flex items-center flex-col justify-center break-all text-center cursor-pointer hover:shadow-xl rounded-lg transition-all duration-500 py-2 mx-2"
          >
            <Phone size={32} />
            <p class="text-xs md:text-sm mt-3">+4407339904995</p>
          </Column>
          <Column
            class="flex items-center flex-col justify-center break-all text-center cursor-pointer hover:shadow-xl rounded-lg transition-all duration-500 py-2 mx-2"
          >
            <Email size={32} />
            <p class="text-xs md:text-sm mt-3">help@digdippa.com</p>
          </Column>
        </Row>

        <!-- Contact Form -->
        <div class="mt-8 bg-white p-7 rounded-lg">
          {#if successContactSaved}
            <div class="w-full flex items-center justify-center">
              Thank you for dropping a message, we will get back to you shortly
            </div>
          {:else}
            <form on:submit|preventDefault={handleContactSubmit}>
              <div class="w-full flex justify-between flex-col md:flex-row">
                <div class="w-full md:w-2/4 mr-5">
                  <TextField
                    label="Your Name"
                    bind:value={contact.name}
                    errorMessage={contactError.name}
                    className="mb-5"
                    labelClassName="font-bold"
                    placeholder="Elon Musk"
                  />
                  <TextField
                    label="Your Email"
                    bind:value={contact.email}
                    errorMessage={contactError.email}
                    className="text-xs font-normal mb-5"
                    placeholder="musk@x.com"
                  />
                  <TextField
                    label="Your Phone"
                    bind:value={contact.phone}
                    errorMessage={contactError.phone}
                    className="text-xs font-normal mb-5"
                    placeholder="+1194802480"
                  />
                </div>
                <div class="w-full md:w-2/4">
                  <TextArea
                    label="Your Message"
                    bind:value={contact.message}
                    errorMessage={contactError.message}
                    rows="9"
                    maxRows={15}
                    placeholder="Your message here"
                  />
                </div>
              </div>

              <PrimaryButton
                className="w-full mx-auto mt-5 md:mt-0"
                type="submit"
                isLoading={isContactSubmiting}
              >
                <span class="mr-2 text-md">Submit</span>
                <Rocket size={24} />
              </PrimaryButton>
            </form>
          {/if}
        </div>
      </Grid>
    </div>
  </section>

  <!-- Waitlist Section -->
  <section id="waitlist" transition:fade class="my-10 mx-auto max-w-6xl w-[95%]">
    <div
      class="bg-blue-700 rounded-lg flex flex-col lg:flex-row lg:items-center px-4 md:px-10 py-14"
    >
      <div class="w-full md:w-[65%] md:mr-4">
        <h1 class="text-4xl font-bold mb-5 mt-0 text-white">Join our mailing list</h1>
        <p class="text-lg text-white">
          We are constantly releasing new courses and sharing them with our email list. Subscribe to
          get notified once we release a new course
        </p>
      </div>
      <form on:submit|preventDefault={handleSubmit} class="my-4 w-full md:w-fit">
        <div class="flex items-center flex-col sm:flex-row">
          {#if success}
            <p class="text-white">You have been added successfully. Thanks for subscribing.</p>
          {:else}
            <TextField
              bind:value={email}
              type="email"
              placeholder="Enter your email.."
              className="sm:mr-3 my-0 w-full md:w-fit"
              isRequired={true}
              isDisabled={isAdding}
              inputClassName="py-2"
            />
            <PrimaryButton
              className="my-1 w-full mt-2"
              variant={VARIANTS.CONTAINED_LIGHT}
              type="submit"
              isLoading={isAdding}>Subscribe</PrimaryButton
            >
          {/if}
        </div>
      </form>
    </div>
  </section>

  <!-- Footer Section -->
  <footer
    id="footer"
    class="flex justify-center flex-col mt-10 w-full px-5 py-10 md:py-3 border-b-0 border-r-0 border-t border-l-0 border-gray-300"
  >
    <ul class="flex w-11/12 items-center flex-col sm:flex-row">
      <div class="logo">
        <a
          href="/"
          title={`Go to ${$currentOrg.name} Home`}
          id="logo"
          data-hveid="8"
          class="flex items-center"
        >
          <img
            src={`${$currentOrg.avatar_url}`}
            alt={`${$currentOrg.name} logo`}
            class="rounded h-10 w-10 inline-block mx-auto"
            data-atf="1"
          />
          <h3 class="text-black ml-3 text-xl">{$currentOrg.name}</h3>
        </a>
      </div>

      <span class="flex-grow" />

      <div class="flex mt-5 sm:mt-0">
        <li class="mx-2">
          <a href="facebook.com" target="_blank" title="Facebook" id="logo-fb" data-hveid="8">
            <LogoFacebook size={24} />
          </a>
        </li>
        <li class="mx-2">
          <a href="twitter.com" target="_blank" title="Twitter" id="logo-tw" data-hveid="8">
            <LogoTwitter size={24} />
          </a>
        </li>
        <li class="mx-2">
          <a href="linkedin.com" target="_blank" title="Linkedin" id="logo-ln" data-hveid="8">
            <LogoLinkedin size={24} />
          </a>
        </li>
      </div>
    </ul>
    <p class="text-center mt-5">
      Powered by
      <a class="text-blue-600 underline" href="https://classroomio.com" target="_blank"
        >ClassroomIO</a
      >
    </p>
  </footer>
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
