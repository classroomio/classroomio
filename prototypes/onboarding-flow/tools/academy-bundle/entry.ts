import { mount, unmount } from 'svelte';
import { toast } from 'svelte-sonner';
import Toaster from '@cio/ui/base/sonner/sonner.svelte';
import Host from './host.svelte';
import CatalogPage from './catalog-page.svelte';
import NotFound from './not-found.svelte';
import PaymentModal from './payment-modal.svelte';
import AuthCard from './auth-card.svelte';
import LearnerApp from './learner/learner-app.svelte';
import { certificateHtml, renderHtmlInto } from './extras';

const COMPONENTS: Record<string, unknown> = {
  catalog: CatalogPage,
  notFound: NotFound,
  paymentModal: PaymentModal,
  authCard: AuthCard,
  learner: LearnerApp
};

type HostInstance = { update: (next: Record<string, unknown>) => void };

/** Mounts one of the academy components with props the page can replace later. */
function mountComponent(name: string, target: HTMLElement, props: Record<string, unknown>) {
  const instance = mount(Host, { target, props: { Comp: COMPONENTS[name] as never, initial: props } }) as unknown as HostInstance;

  return { update: (next: Record<string, unknown>) => instance.update(next), destroy: () => unmount(instance as never) };
}

let toasterMounted = false;

/** The product snackbar (svelte-sonner), mounted on first use. */
function notify(message: string, kind: 'success' | 'error' | 'info' = 'success') {
  if (!toasterMounted) {
    toasterMounted = true;
    mount(Toaster, { target: document.body });
  }

  toast[kind](message);
}

(window as unknown as { CioAcademy: unknown }).CioAcademy = {
  mount: mountComponent,
  catalog: (target: HTMLElement, props: Record<string, unknown>) => mountComponent('catalog', target, props),
  notify,
  certificateHtml,
  renderHtmlInto
};
