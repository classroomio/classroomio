import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { SquareArrowOutUpRight } from 'lucide-react';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <div className="flex items-center gap-2">
          <img src="/logo-192.png" className="size-8" alt="ClassroomIO logo" />
          <span className="font-medium">ClassroomIO</span>
        </div>
      )
    },
    links: [
      {
        text: (
          <div className="flex items-center gap-2">
            Contact <SquareArrowOutUpRight />
          </div>
        ),
        url: 'https://twitter.com/classroomio',
        external: true
      },
      {
        text: (
          <div className="flex items-center gap-2">
            Demo <SquareArrowOutUpRight />
          </div>
        ),
        url: 'https://dub.sh/ciodemo',
        external: true
      },
      {
        text: (
          <div className="flex items-center gap-2">
            Dashboard <SquareArrowOutUpRight />
          </div>
        ),
        url: 'https://app.classroomio.com/',
        external: true
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
