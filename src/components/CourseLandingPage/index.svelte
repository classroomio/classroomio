<script>
  import { onMount } from 'svelte';
  import RecentlyViewed16 from 'carbon-icons-svelte/lib/RecentlyViewed16';
  import CurrencyDollar16 from 'carbon-icons-svelte/lib/CurrencyDollar16';
  import Alarm16 from 'carbon-icons-svelte/lib/Alarm16';
  import { stores } from '@sapper/app';
  import Expandable from '../Expandable/index.svelte';
  import PrimaryButton from '../PrimaryButton/index.svelte';
  import MarkdownRender from '../MarkdownRender/index.svelte';

  let activeNavItem = '';

  const data = {
    title: 'Online Business Masterclass: Sell Your Own Digital Products',
    shortDescription:
      'Create, Launch & Market Your Own Online Business w/ Digital Products such as Online Courses, Coaching, eBooks, Webinars+',
    cost: {
      currency: '$',
      price: '300',
    },
    requirement:
      "You don't need any experience creating an online business or digital product. \nYou don't need an online presence, website, or following - but it will help kickstart your online business if you do.",
    description:
      "### Have you ever dreamed of starting your own online business?. \n\nOf course I know that :-) I was just thinking if there is some way to do same as getStaticProps for other components too. I don't think such feature is completely necessary, though. \n### Enroll today and get instant access to. \n\nOf course I know that :-) I was just thinking if there is some way to do same as getStaticProps for other components too. I don't think such feature is completely necessary, though.\n ### You will learn many types of digital marketing:\n\n Of course I know that :-) I was just thinking if there is some way to do same as getStaticProps for other components too. I don't think such feature is completely necessary, though. Hello, thank you for reply. Of course I know that :-) I was just thinking if there is some way to do same as getStaticProps for other components too. I don't think such feature is completely necessary, though. Hello, thank you for reply. Of course I know that :-) I was just thinking if there is some way to do same as getStaticProps for other components too. I don't think such feature is completely necessary, though. Hello, thank you for reply. Of course I know that :-) I was just thinking if there is some way to do same as getStaticProps for other components too. I don't think such feature is completely necessary, though. Hello, thank you for reply. Of course I know that :-) I was just thinking if there is some way to do same as getStaticProps for other components too. I don't think such feature is completely necessary, though.",
    lessons: [
      {
        title: 'What is FinTech?',
      },
      {
        title: 'Payments, Cryptocurrencies and Blockchain',
      },
      {
        title: 'Digital Finance and Alternative Finance',
      },
      {
        title: 'FinTech Regulation and RegTech',
      },
      {
        title: 'Data & TechFin',
      },
    ],
    aboutUs: {
      companyName: 'The Brad School',
      logoUrl: 'https://img-c.udemycdn.com/user/200_H/19701574_95d1_13.jpg',
      description:
        '*Learn creative skills, from absolute beginner to advanced mastery.*\nVideo School exists to help you succeed in life. Each course has been hand-tailored to teach a specific skill from photography and video to art, design and business.\n**Whether you’re trying to learn a new skill from scratch, or want to refresh your memory on something you’ve learned in the past, you’ve come to the right place.**\nEducation makes the world a better place. Make your world better with new skills!\nOur courses can be watched 24/7 wherever you are. Most are fully downloadable so you can take them with you. You can also view them on mobile devices with the Udemy mobile app.\nAll courses have a 30-day money-back guarantee so that you can check it out, make sure it’s the right course for you, and get a refund if it’s not!',
    },
  };
  const navItems = [
    {
      label: 'Requirement',
      key: 'requirement',
    },
    {
      label: 'Description',
      key: 'description',
    },
    {
      label: 'Syllabus',
      key: 'syllabus',
    },
    {
      label: 'About Us',
      key: 'about-us',
    },
  ];

  const expandableRootClass =
    'max-w-4xl pt-5 my-3 border-r-0 border-b border-l-0 border-gray-300';
  const { page } = stores();

  function handleEnrol() {}
  function handleNavItemClick(navItem) {
    return () => {
      activeNavItem = navItem;
    };
  }

  onMount(() => {
    activeNavItem = window.location.hash || navItems[0].key;
  });
</script>

<svelte:head>
  <title>{data.title}</title>
</svelte:head>

<div class="w-full bg-white flex flex-col items-center">
  <section
    class="w-full flex items-center justify-center bg-gray-900 text-white p-6 pb-10"
  >
    <div class="container flex justify-between items-center">
      <div class="course-description mr-3">
        <h1>
          {data.title}
        </h1>
        <h5>
          {data.shortDescription}
        </h5>
        <div>
          <span class="flex items-center">
            <RecentlyViewed16 class="carbon-icon mr-2" />
            Last updated 10/2021
          </span>
        </div>
      </div>
      <div class="action-container bg-white p-3 flex items-start flex-col">
        <p class="mb-2 text-black text-md flex items-center">
          <Alarm16 class="carbon-icon active mr-2" />
          Estimated 8 weeks
        </p>
        <p class="mb-2 text-black text-md flex items-center">
          <CurrencyDollar16 class="carbon-icon active mr-2" />
          {data.cost.currency}{data.cost.price}
        </p>
        <PrimaryButton
          label="Enrol"
          onClick={handleEnrol}
          className="md:w-full"
        />
      </div>
    </div>
  </section>

  <nav
    class="w-full z-10 max-w-4xl flex items-center justify-evenly py-4 px-4 bg-gray-100 mt-4 sticky top-0"
  >
    {#each navItems as navItem}
      <p
        class="text-md text-gray-900 {activeNavItem === navItem.key &&
          'font-bold'}"
        on:click={handleNavItemClick(navItem.key)}
      >
        <a href="{$page.path}#{navItem.key}">{navItem.label}</a>
      </p>
    {/each}
  </nav>

  <Expandable
    id="requirement"
    title="Requirement"
    titleClass="text-2xl"
    rootClass={expandableRootClass}
    supportsLink={true}
  >
    <MarkdownRender content={data.requirement} disableMaxWidth={true} />
  </Expandable>

  <Expandable
    id="description"
    title="Description"
    titleClass="text-2xl"
    rootClass={expandableRootClass}
    supportsLink={true}
  >
    <MarkdownRender content={data.description} disableMaxWidth={true} />
  </Expandable>

  <Expandable
    id="syllabus"
    title="Syllabus"
    titleClass="text-2xl"
    rootClass={expandableRootClass}
    supportsLink={true}
  >
    {#each data.lessons as lesson, index}
      <div class="flex items-center my-2">
        <strong class="mr-2">Lesson {index + 1}. </strong>
        {lesson.title}
      </div>
    {/each}
  </Expandable>

  <Expandable
    id="about-us"
    title="About Us - {data.aboutUs.companyName}"
    titleClass="text-2xl"
    rootClass={expandableRootClass}
    supportsLink={true}
  >
    <div class="w-full">
      <img
        src={data.aboutUs.logoUrl}
        alt={data.aboutUs.companyName}
        height="260"
        width="260"
        class="rounded-full m-auto"
      />
    </div>
    <MarkdownRender content={data.description} disableMaxWidth={true} />
  </Expandable>
</div>

<style lang="scss">
  .container {
    max-width: 800px;

    .course-description {
      max-width: 500px;
    }

    .action-container {
      height: fit-content;
      width: 200px;
    }
  }
</style>
