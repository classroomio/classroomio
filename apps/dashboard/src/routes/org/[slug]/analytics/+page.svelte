<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  let site = 'classroomio.com';

  function handleMessage(event) {
    // For development, we only accept messages from localhost:3005
    if (event.origin !== 'http://localhost:3005') {
      console.warn('Received message from unexpected origin:', event.origin);
      return;
    }

    try {
      const { type, params } = event.data;
      if (type === 'urlUpdate' && params) {
        // Update the URL in the parent window without page refresh
        const newUrl = `${$page.url.pathname}?${new URLSearchParams(params)}`;
        goto(newUrl, {
          replaceState: true, // This prevents page refresh
          keepFocus: true, // Maintains focus on the current element
          noScroll: true // Prevents scrolling to top
        });
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  }

  // Listen for messages from the iframe
  onMount(() => {
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  });

  // Get initial URL parameters
  $: initialParams = $page.url.searchParams;
  $: iframeUrl = `http://localhost:3005/dashboard?site=${site}${
    initialParams ? '&' + initialParams : ''
  }`;
  $: console.log('refresh token');
</script>

<iframe
  src={iframeUrl}
  width="100%"
  height="100%"
  frameborder="0"
  scrolling="yes"
  title="Analytics Dashboard"
></iframe>
