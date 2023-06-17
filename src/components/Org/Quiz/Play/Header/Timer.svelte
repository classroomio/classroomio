<script>
  import { onMount } from 'svelte';
  import CircleContent from './CircleContent.svelte';

  export let startCount = false;
  export let timelimit = '';

  let countDownNo = 0;
  let started = false;

  function triggerCountDown(start) {
    if (!start || started) return;

    const getNum = (k) => parseInt(timelimit.replace(k, ''));

    if (timelimit.includes('s')) {
      countDownNo = getNum('s');
    } else if (timelimit.includes('m')) {
      countDownNo = getNum('m') * 60;
    }

    window.refreshIntervalId = setInterval(() => {
      if (--countDownNo <= 0) {
        clearInterval(window.refreshIntervalId);
      }
    }, 1000);
    started = true;
  }

  onMount(() => {
    if (startCount) {
      triggerCountDown(startCount);
    }
  });

  $: triggerCountDown(startCount);
</script>

<CircleContent value={countDownNo} label="Second(s)" className="mr-3" />
