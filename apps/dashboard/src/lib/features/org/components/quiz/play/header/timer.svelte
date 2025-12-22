<script lang="ts">
  import { onMount } from 'svelte';
  import CircleContent from './circle-content.svelte';

  interface Props {
    startCount?: boolean;
    timelimit?: string;
  }

  let { startCount = false, timelimit = '' }: Props = $props();

  let countDownNo = $state(0);
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

  $effect(() => {
    triggerCountDown(startCount);
  });
</script>

<CircleContent value={countDownNo} label="Second(s)" className="mr-3" />
