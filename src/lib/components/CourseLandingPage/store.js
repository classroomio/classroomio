import { writable } from 'svelte/store';

export const landingPageStore = writable({
  header: {
    title: 'Online Business Masterclass: Sell Your Own Digital Products',
    description:
      'Create, Launch & Market Your Own Online Business w/ Digital Products such as Online Courses, Coaching, eBooks, Webinars+',
    duration: 'Estimated 8 weeks',
    cost: 300,
    currency: '$',
    buttonLabel: 'Enrol'
  },
  requirement: {
    content:
      "You don't need any experience creating an online business or digital product. \nYou don't need an online presence, website, or following - but it will help kickstart your online business if you do."
  },
  description: {
    content:
      "### Have you ever dreamed of starting your own online business?. \n\nOf course I know that :-) I was just thinking if there is some way to do same as getStaticProps for other components too. I don't think such feature is completely necessary, though. \n### Enroll today and get instant access to. \n\nOf course I know that :-) I was just thinking if there is some way to do same as getStaticProps for other components too. I don't think such feature is completely necessary, though.\n ### You will learn many types of digital marketing:\n\n Of course I know that :-) I was just thinking if there is some way to do same as getStaticProps for other components too. I don't think such feature is completely necessary, though. Hello, thank you for reply. Of course I know that :-) I was just thinking if there is some way to do same as getStaticProps for other components too. I don't think such feature is completely necessary, though. Hello, thank you for reply. Of course I know that :-) I was just thinking if there is some way to do same as getStaticProps for other components too. I don't think such feature is completely necessary, though. Hello, thank you for reply. Of course I know that :-) I was just thinking if there is some way to do same as getStaticProps for other components too. I don't think such feature is completely necessary, though. Hello, thank you for reply. Of course I know that :-) I was just thinking if there is some way to do same as getStaticProps for other components too. I don't think such feature is completely necessary, though."
  },
  syllabus: {
    lessons: [
      {
        title: 'What is FinTech?'
      },
      {
        title: 'Payments, Cryptocurrencies and Blockchain'
      },
      {
        title: 'Digital Finance and Alternative Finance'
      },
      {
        title: 'FinTech Regulation and RegTech'
      },
      {
        title: 'Data & TechFin'
      }
    ]
  },
  aboutUs: {
    companyName: 'The Brad School',
    logoUrl: 'https://img-c.udemycdn.com/user/200_H/19701574_95d1_13.jpg',
    description:
      '*Learn creative skills, from absolute beginner to advanced mastery.*\nVideo School exists to help you succeed in life. Each course has been hand-tailored to teach a specific skill from photography and video to art, design and business.\n**Whether you’re trying to learn a new skill from scratch, or want to refresh your memory on something you’ve learned in the past, you’ve come to the right place.**\nEducation makes the world a better place. Make your world better with new skills!\nOur courses can be watched 24/7 wherever you are. Most are fully downloadable so you can take them with you. You can also view them on mobile devices with the Udemy mobile app.\nAll courses have a 30-day money-back guarantee so that you can check it out, make sure it’s the right course for you, and get a refund if it’s not!'
  },
  reviews: [
    {
      id: 1,
      show: true,
      name: 'Adeyemi Adetunji',
      avatar_url: '/logo-192.png',
      rating: 1,
      created_at: new Date(),
      description: 'rice ventore officiis maxime laudantium recusandae sit dolor.'
    }
  ]
});

export const reviewsModalStore = writable({
  open: false
});

export const landingPage = writable({
  uploadingImage: false,
  imageUrl: ''
});

export let handleOpenWidget = writable({
  open: false
});
