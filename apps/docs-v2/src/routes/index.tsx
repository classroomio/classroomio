import { createFileRoute, Link } from '@tanstack/react-router';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';

export const Route = createFileRoute('/')({
  component: Home
});

function Home() {
  return (
    <HomeLayout {...baseOptions()}>
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="mb-8 text-4xl font-bold">The ClassroomIO Documentation</h1>

        <img
          alt="A flexible, user-friendly platform for creating, managing, and delivering courses for companies and training organisations"
          src="https://brand.cdn.clsrio.com/og/classroomio-og.png"
          className="mb-8 w-full rounded-lg"
        />

        <div className="prose dark:prose-invert space-y-4">
          <p>
            This is the documentation for ClassroomIO, a platform to streamline training for
            everyone. Our all-in-one platform empowers bootcamps, educators, and businesses to
            manage training programs easily. Anyone can run multiple classes and cohorts all from
            one UI, the application is mobile-first, which means that students can access all
            published content from any device.
          </p>

          <p>
            It covers everything from setup to usage. You'd find a well detailed explanation of the
            core features ClassroomIO offers and how to take advantage of them. Developers and
            Designers can find everything they need to successfully contribute to the project. For
            more practical usage, we've got a ton of guides ranging from simple functionalities to
            more complex ones. If there is something we don't cover in this documentation, please
            feel free to open an issue and we can pick it up from there.
          </p>
        </div>

        <Link
          to="/docs/$"
          params={{
            _splat: 'howtoguides/create-first-course'
          }}
          className="bg-fd-primary text-fd-primary-foreground mt-8 inline-block rounded-lg px-4 py-2 font-medium"
        >
          Get Started
        </Link>
      </div>
    </HomeLayout>
  );
}
