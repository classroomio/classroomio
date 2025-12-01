import { createFileRoute, Link } from '@tanstack/react-router';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';

export const Route = createFileRoute('/')({
  component: Home
});

function Home() {
  return (
    <HomeLayout {...baseOptions()} className="border-2 border-white text-center">
      <h1 className="mb-4 text-xl font-medium">Fumadocs on Tanstack Start.</h1>
      <Link
        to="/docs/$"
        params={{
          _splat: ''
        }}
        className="bg-fd-primary text-fd-primary-foreground mx-auto rounded-lg px-3 py-2 text-sm font-medium"
      >
        Open Docs
      </Link>
    </HomeLayout>
  );
}
