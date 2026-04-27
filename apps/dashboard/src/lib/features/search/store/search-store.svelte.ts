import type { SearchScope } from '../utils/types';

class SearchStore {
  isOpen = $state(false);
  scope: SearchScope = $state('org');

  open(scope: SearchScope = 'org') {
    this.scope = scope;
    this.isOpen = true;
  }

  close() {
    this.isOpen = false;
  }

  toggle(scope: SearchScope = 'org') {
    this.scope = scope;
    this.isOpen = !this.isOpen;
  }
}

export const searchStore = new SearchStore();
