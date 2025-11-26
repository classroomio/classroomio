<<<<<<< HEAD
import { MediaQuery } from "svelte/reactivity";
=======
import { MediaQuery } from 'svelte/reactivity';
>>>>>>> feat/release-v2

const DEFAULT_MOBILE_BREAKPOINT = 768;

export class IsMobile extends MediaQuery {
<<<<<<< HEAD
	constructor(breakpoint: number = DEFAULT_MOBILE_BREAKPOINT) {
		super(`max-width: ${breakpoint - 1}px`);
	}
=======
  constructor(breakpoint: number = DEFAULT_MOBILE_BREAKPOINT) {
    super(`max-width: ${breakpoint - 1}px`);
  }
>>>>>>> feat/release-v2
}
