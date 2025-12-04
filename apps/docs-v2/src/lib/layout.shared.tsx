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
    }
  };
}
