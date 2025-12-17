import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <img src="/logo-16.png" alt="" />
          <span className="font-medium">ClassroomIO</span>
        </>
      )
    },
    links: [
      {
        type: 'menu',
        text: 'Guide',
        items: [
          {
            text: 'Contact',
            description: 'Get in touch with our team on Twitter',
            url: 'https://twitter.com/classroomio',
            external: true
          },
          {
            text: 'Demo',
            description: 'Schedule a live demo to see ClassroomIO in action',
            url: 'https://dub.sh/ciodemo',
            external: true
          },
          {
            text: 'Dashboard',
            description: 'Access your ClassroomIO dashboard and manage courses',
            url: 'https://app.classroomio.com/',
            external: true
          }
        ]
      },
      {
        type: 'icon',
        label: 'Discord',
        icon: (
          <img
            src="/discord-blue.png"
            alt="discord icon"
            className="w-7 transition-all duration-500 hover:scale-90"
          />
        ),
        text: 'Discord',
        url: 'https://dub.sh/ciodiscord',
        external: true
      }
    ],
    githubUrl: 'https://github.com/classroomio/classroomio'
  };
}
