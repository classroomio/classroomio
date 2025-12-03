<script lang="ts">
  import Modal from '$lib/components/Modal/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import {
    NOTIFICATION_NAME,
    triggerSendEmail
  } from '$lib/utils/services/notification/notification';
  import { currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';

  const WAIT_SEC = 120;
  const WAIT_TIME = WAIT_SEC * 1000;

  let open = false;
  let loading = false;
  let isSent = false;
  let interval;
  let countDown = WAIT_SEC;
  let protectionInterval;
  let domObserver;

  // Security protection - disable all interactions when email not verified
  function setupDOMProtection() {
    if (!browser) return;

    // Function to disable all interactive elements
    function disableInteractions() {
      if ($profile.is_email_verified) return;

      // Disable all buttons except verification-related ones
      const buttons = document.querySelectorAll(
        'button, [role="button"], a[href], input[type="submit"]'
      );
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

    function preventInteraction(event) {
      if (!$profile.is_email_verified) {
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
        if (
          element.tagName === 'INPUT' ||
          element.tagName === 'TEXTAREA' ||
          element.tagName === 'SELECT'
        ) {
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

        if (shouldReapply && !$profile.is_email_verified) {
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
      if ($profile.is_email_verified) {
        enableInteractions();
        clearInterval(protectionInterval);
        if (domObserver) domObserver.disconnect();
      } else {
        disableInteractions();
      }
    }, 1000);

    // Initial protection
    if (!$profile.is_email_verified) {
      disableInteractions();
    }

    // Add global CSS to prevent any missed interactions
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

  function updateBodyClass() {
    if (browser) {
      if ($profile.is_email_verified) {
        document.body.classList.add('email-verified');
      } else {
        document.body.classList.remove('email-verified');
      }
    }
  }

  const sendVerificationCode = async () => {
    if (isSent) return;

    loading = true;

    try {
      triggerSendEmail(NOTIFICATION_NAME.VERIFY_EMAIL, {
        to: $profile.email,
        profileId: $profile.id,
        fullname: $profile.fullname
      });

      isSent = true;
    } catch (error) {
      snackbar.error('verify_email_modal.snackbar.error');
    } finally {
      loading = false;
    }

    interval = setInterval(() => {
      countDown = countDown - 1;
    }, 1000);

    setTimeout(() => {
      isSent = false;
      clearInterval(interval);
    }, WAIT_TIME);
  };

  onMount(() => {
    if (browser && $profile.id) {
      setupDOMProtection();
    }
  });

  onDestroy(() => {
    if (interval) clearInterval(interval);
    if (protectionInterval) clearInterval(protectionInterval);
    if (domObserver) domObserver.disconnect();

    // Clean up protection styles
    const style = document.getElementById('email-verification-protection');
    if (style) style.remove();
  });

  $: open = Boolean(!$profile.is_email_verified && !!$profile.id && !!$currentOrg.id);
  $: open && sendVerificationCode();
  $: updateBodyClass();

  // Console warning for developers trying to bypass
  $: if (browser && !$profile.is_email_verified && $profile.id) {
    console.warn(
      '%c🔒 SECURITY WARNING: Email verification required',
      'color: red; font-weight: bold; font-size: 16px;',
      '\nAll user interactions are disabled until email verification is completed.',
      '\nAttempting to bypass this protection is monitored and logged.'
    );
  }
</script>

<Modal {open} isCloseable={false} width="w-4/5" maxWidth="w-[500px]" containerClass="p-4">
  <div class="flex flex-col items-center space-y-6 text-center">
    <img src="/verify-email.svg" alt="email verification" />
    <p class="text-xl font-bold">{$t('verify_email_modal.heading')}</p>
    <p class="w-[70%] text-sm text-gray-700 dark:text-gray-200">
      {$t('verify_email_modal.sent_verification')}
      {$profile.email}
      {$t('verify_email_modal.to_confirm')}
    </p>

    <div class="flex flex-col items-center">
      <PrimaryButton
        isDisabled={loading || isSent}
        className="font-normal"
        onClick={sendVerificationCode}
      >
        {#if loading}
          {$t('verify_email_modal.loading')}
        {:else}
          {$t('verify_email_modal.resend')}
        {/if}
      </PrimaryButton>
      {#if isSent}
        <p class="text-xs text-gray-700">
          {$t('verify_email_modal.resend_in')}
          {countDown}
          {$t('verify_email_modal.seconds')}
        </p>
      {/if}
    </div>
  </div>
</Modal>
