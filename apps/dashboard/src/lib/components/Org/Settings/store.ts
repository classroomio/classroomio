import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

export interface OrgLandingPageJson {
  header: {
    title: string;
    titleHighlight: string;
    subtitle: string;
    action: {
      label: string;
      link: string;
      redirect: boolean;
    };
    banner: {
      video: string;
      image: string;
      type: string;
      show: boolean;
    };
    background?: {
      image: string;
      show: boolean;
    };
    show: boolean;
  };
  aboutUs: {
    title: string;
    content: string;
    imageUrl: string;
    show: boolean;
  };
  courses: {
    title: string;
    titleHighlight: string;
    subtitle: string;
    show: boolean;
  };
  faq: {
    title: string;
    questions: Array<{
      id: number;
      title: string;
      content: string;
    }>;
    show: boolean;
  };
  contact: {
    title: string;
    titleHighlight: string;
    subtitle: string;
    address: string;
    phone: string;
    email: string;
    show: boolean;
  };
  mailinglist: {
    title: string;
    subtitle: string;
    buttonLabel: string;
    show: boolean;
  };
  customLinks: {
    show: boolean;
    links: Array<{
      id: number;
      label: string;
      url: string;
      openInNewTab: boolean;
    }>;
  };
  footer: {
    facebook: string;
    instagram: string;
    twitter: string;
    linkedin: string;
    show: boolean;
  };
}

export const landingPageSettings: Writable<OrgLandingPageJson> = writable({
  header: {
    title: 'Web Development Courses for',
    titleHighlight: 'Everyone',
    subtitle:
      'Practical project-based courses that are easy to understand and straight to the point',
    action: {
      label: 'Start learning Today',
      link: '#contact',
      redirect: false
    },
    banner: {
      video: 'https://www.youtube.com/watch?v=qqAYW7uxErI',
      image: '',
      type: 'video',
      show: true
    },
    background: {
      image: '',
      show: true
    },
    show: true
  },
  aboutUs: {
    title: 'Our Story',
    content:
      'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Repudiandae, quaerat cum. Ullam similique quae dicta ipsum atque quam fugit iusto eligendi magni voluptatum aut, exercitationem deserunt vitae iste rem sunt!\nLorem ipsum, dolor sit amet consectetur adipisicing elit. Maiores obcaecati veritatis tenetur in, nihil repellat quasi cumque sed molestias id reiciendis harum doloremque minus fugit quia cum dolores quas pariatur.',
    imageUrl:
      'https://pgrest.classroomio.com/storage/v1/object/public/avatars/landingpage/riverside.jpeg',
    show: true
  },
  courses: {
    title: 'Explore our',
    titleHighlight: 'Courses',
    subtitle: 'Find courses you will love from best teachers all over the world🌎.',
    show: true
  },
  faq: {
    title: 'Frequently Asked Questions.',
    questions: [
      {
        id: 1,
        title: 'Lorem ipsum dolor sit, amet con',
        content:
          'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Repudiandae, quaerat cum. Ullam similique quae dicta ipsum atque quam fugit iusto eligendi magni voluptatum aut, exercitationem deserunt vitae iste rem sunt!\nLorem ipsum, dolor sit amet consectetur adipisicing elit. Maiores obcaecati veritatis tenetur in, nihil repellat quasi cumque sed molestias id reiciendis harum doloremque minus fugit quia cum dolores quas pariatur.'
      },
      {
        id: 2,
        title: 'Lorem ipsum dolor sit, amet con',
        content:
          'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Repudiandae, quaerat cum. Ullam similique quae dicta ipsum atque quam fugit iusto eligendi magni voluptatum aut, exercitationem deserunt vitae iste rem sunt!\nLorem ipsum, dolor sit amet consectetur adipisicing elit. Maiores obcaecati veritatis tenetur in, nihil repellat quasi cumque sed molestias id reiciendis harum doloremque minus fugit quia cum dolores quas pariatur.'
      },
      {
        id: 3,
        title: 'Lorem ipsum dolor sit, amet con',
        content:
          'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Repudiandae, quaerat cum. Ullam similique quae dicta ipsum atque quam fugit iusto eligendi magni voluptatum aut, exercitationem deserunt vitae iste rem sunt!\nLorem ipsum, dolor sit amet consectetur adipisicing elit. Maiores obcaecati veritatis tenetur in, nihil repellat quasi cumque sed molestias id reiciendis harum doloremque minus fugit quia cum dolores quas pariatur.'
      }
    ],
    show: true
  },
  contact: {
    title: 'Have you got any',
    titleHighlight: 'Question?',
    subtitle: 'Reach out to us with any question you might have.',
    address: 'Ashwoodfield House Farm, Kidderminster Rd, Stourbridge, Kingswinford DY6 0AA',
    phone: '+4407339904995',
    email: 'help@digdippa.com',
    show: true
  },
  mailinglist: {
    title: 'Join our mailing list',
    subtitle:
      'We are constantly releasing new courses and sharing them with our email list. Subscribe to get notified once we release a new course',
    buttonLabel: 'Subscribe',
    show: true
  },
  customLinks: {
    show: true,
    links: [
      {
        id: 1,
        label: 'About Us',
        url: '#aboutus',
        openInNewTab: false
      },
      {
        id: 2,
        label: 'Courses',
        url: '#courses',
        openInNewTab: false
      },
      {
        id: 3,
        label: 'FAQ',
        url: '#faq',
        openInNewTab: false
      },
      {
        id: 4,
        label: 'Contact Us',
        url: '#contact',
        openInNewTab: false
      }
    ]
  },
  footer: {
    facebook: '#',
    instagram: '#',
    twitter: '#',
    linkedin: '#',
    show: true
  }
});
