import type { Readable } from 'svelte/store';
import { browser } from '$app/environment';

export interface DOMProtectionCleanup {
  protectionInterval?: ReturnType<typeof setInterval>;
  domObserver?: MutationObserver;
  cleanup: () => void;
}

/**
 * Sets up DOM protection to disable all interactions when email is not verified.
 * Returns cleanup functions to properly dispose of intervals and observers.
 *
 * @param isEmailVerified - A readable store or getter function that returns whether email is verified
 * @returns Cleanup object with intervals, observers, and a cleanup function
 */
export function setupDOMProtection(isEmailVerified: Readable<boolean> | (() => boolean | null)): DOMProtectionCleanup {
  if (!browser) {
    return {
      cleanup: () => {}
    };
  }

  let protectionInterval: ReturnType<typeof setInterval> | undefined;
  let domObserver: MutationObserver | undefined;

  // Helper to get current verification status
  const getIsVerified = () => {
    if (typeof isEmailVerified === 'function') {
      return isEmailVerified() ?? false;
    }
    // For stores, we need to subscribe temporarily - this is a limitation
    // In practice, the component should pass a getter function
    let value = false;
    const unsubscribe = isEmailVerified.subscribe((v) => {
      value = v ?? false;
    });
    unsubscribe();
    return value;
  };

  // Function to disable all interactive elements
  function disableInteractions() {
    if (getIsVerified()) return;

    // Disable all buttons except verification-related ones
    const buttons = document.querySelectorAll('button, [role="button"], a[href], input[type="submit"]');
    buttons.forEach((button) => {
      const el = button as HTMLElement;

      // Skip if already protected or is verification-related
      if (
        el.dataset.verificationProtected === 'true' ||
        el.closest('[data-verification-modal]') ||
        el.textContent?.toLowerCase().includes('verify') ||
        el.textContent?.toLowerCase().includes('resend')
      ) {
        return;
      }

      el.dataset.verificationProtected = 'true';
      el.dataset.originalPointerEvents = el.style.pointerEvents || 'auto';
      el.style.pointerEvents = 'none';
      el.style.opacity = '0.5';
      el.style.cursor = 'not-allowed';
      el.setAttribute('title', 'Email verification required');

      // Add click prevention
      el.addEventListener('click', preventInteraction, true);
      el.addEventListener('mousedown', preventInteraction, true);
    });

    // Disable all form inputs
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach((input) => {
      const el = input as HTMLInputElement;

      // Skip if in verification modal
      if (el.closest('[data-verification-modal]')) return;

      if (!el.dataset.verificationProtected) {
        el.dataset.verificationProtected = 'true';
        el.dataset.originalDisabled = el.disabled ? 'true' : 'false';
        el.disabled = true;
        el.style.opacity = '0.5';
        el.addEventListener('focus', preventInteraction, true);
        el.addEventListener('input', preventInteraction, true);
      }
    });

    // Disable contenteditable elements
    const editables = document.querySelectorAll('[contenteditable="true"]');
    editables.forEach((el) => {
      const element = el as HTMLElement;
      if (!element.dataset.verificationProtected) {
        element.dataset.verificationProtected = 'true';
        element.contentEditable = 'false';
        element.style.opacity = '0.5';
      }
    });
  }

  function preventInteraction(event: Event) {
    if (!getIsVerified()) {
      event.preventDefault();
      event.stopImmediatePropagation();

      // Show warning
      if (event.target) {
        const target = event.target as HTMLElement;
        target.setAttribute('title', 'Please verify your email to use this feature');
      }

      // Optional: Show alert
      console.warn('🔒 Email verification required to interact with this element');
      return false;
    }
  }

  // Function to restore interactions when verified
  function enableInteractions() {
    const protectedElements = document.querySelectorAll('[data-verification-protected="true"]');
    protectedElements.forEach((el) => {
      const element = el as HTMLElement;

      // Restore styles
      if (element.dataset.originalPointerEvents) {
        element.style.pointerEvents = element.dataset.originalPointerEvents;
      } else {
        element.style.pointerEvents = '';
      }
      element.style.opacity = '';
      element.style.cursor = '';
      element.removeAttribute('title');

      // Restore functionality for inputs
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
        const input = element as HTMLInputElement;
        input.disabled = input.dataset.originalDisabled === 'true';
      }

      // Restore contenteditable
      if (element.hasAttribute('contenteditable')) {
        element.contentEditable = 'true';
      }

      // Remove event listeners
      element.removeEventListener('click', preventInteraction, true);
      element.removeEventListener('mousedown', preventInteraction, true);
      element.removeEventListener('focus', preventInteraction, true);
      element.removeEventListener('input', preventInteraction, true);

      // Clean up data attributes
      delete element.dataset.verificationProtected;
      delete element.dataset.originalPointerEvents;
      delete element.dataset.originalDisabled;
    });
  }

  // Set up mutation observer to protect new elements
  if (window.MutationObserver) {
    domObserver = new MutationObserver((mutations) => {
      let shouldReapply = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldReapply = true;
        }
      });

      if (shouldReapply && !getIsVerified()) {
        setTimeout(disableInteractions, 100);
      }
    });

    domObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Run protection every second
  protectionInterval = setInterval(() => {
    if (getIsVerified()) {
      enableInteractions();
      cleanup();
    } else {
      disableInteractions();
    }
  }, 1000);

  // Initial protection
  if (!getIsVerified()) {
    disableInteractions();
  }

  // Add global CSS to prevent any missed interactions
  if (document) {
    const style = document.createElement('style');
    style.id = 'email-verification-protection';
    style.textContent = `
        body:not(.email-verified) button:not([data-verification-modal] button),
        body:not(.email-verified) a:not([data-verification-modal] a),
        body:not(.email-verified) input:not([data-verification-modal] input),
        body:not(.email-verified) textarea:not([data-verification-modal] textarea),
        body:not(.email-verified) [contenteditable="true"]:not([data-verification-modal] [contenteditable]) {
          pointer-events: none !important;
          opacity: 0.5 !important;
          user-select: none !important;
        }
      `;
    document.head.appendChild(style);
  }

  function cleanup() {
    if (protectionInterval) {
      clearInterval(protectionInterval);
      protectionInterval = undefined;
    }
    if (domObserver) {
      domObserver.disconnect();
      domObserver = undefined;
    }

    // Clean up protection styles
    if (browser) {
      const style = document?.getElementById('email-verification-protection');
      if (style) style.remove();
    }
  }

  return {
    protectionInterval,
    domObserver,
    cleanup
  };
}

/**
 * Updates the body class based on email verification status
 */
export function updateBodyClass(isEmailVerified: boolean | null) {
  if (!browser) {
    return;
  }

  if (isEmailVerified) {
    document.body.classList.add('email-verified');
  } else {
    document.body.classList.remove('email-verified');
  }
}
