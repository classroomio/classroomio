<script lang="ts">
  import MachineFrame from './machine-frame.svelte';
  import type { MachineProps } from './types';

  interface Props extends MachineProps {
    lessons?: string;
    exercises?: string;
    certificates?: string;
  }

  let {
    label,
    stillAt = 2.4,
    class: className,
    lessons = 'LESSONS',
    exercises = 'EXERCISES',
    certificates = 'CERTIFICATES'
  }: Props = $props();
</script>

<MachineFrame viewBox="-105 -115 235 248" {label} {stillAt} class={className}>
  <polygon class="ln" points="-86.6,50.0 26.0,115.0 26.0,109.0 -86.6,44.0"></polygon><polygon
    class="ln"
    points="112.6,65.0 26.0,115.0 26.0,109.0 112.6,59.0"
  ></polygon><polygon class="ln" points="0.0,-6.0 112.6,59.0 26.0,109.0 -86.6,44.0"></polygon><polygon
    class="ln"
    points="-65.8,42.0 -10.4,74.0 -10.4,-28.0 -65.8,-60.0"
  ></polygon><polygon class="ln" points="52.0,38.0 -10.4,74.0 -10.4,-28.0 52.0,-64.0"></polygon><polygon
    class="ln"
    points="-3.5,-96.0 52.0,-64.0 -10.4,-28.0 -65.8,-60.0"
  ></polygon><polygon class="lo" points="52.0,34.0 -10.4,70.0 -10.4,42.0 52.0,6.0"></polygon><polygon
    class="lo"
    points="52.0,2.0 -10.4,38.0 -10.4,10.0 52.0,-26.0"
  ></polygon><polygon class="lo" points="52.0,-30.0 -10.4,6.0 -10.4,-22.0 52.0,-58.0"></polygon><g
    ><animateTransform
      attributeName="transform"
      type="translate"
      values="0.0,0.0;0.0,0.0;36.4,21.0;33.8,19.5;36.4,21.0;36.4,21.0;0.0,0.0;0.0,0.0"
      keyTimes="0;0.6769;0.7462;0.7577;0.7692;0.8923;0.9615;1"
      calcMode="spline"
      keySplines=".42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1"
      dur="13s"
      repeatCount="indefinite"
    ></animateTransform><polygon class="ln" points="-45.0,50.0 -10.4,70.0 -10.4,42.0 -45.0,22.0"></polygon><polygon
      class="ln"
      points="52.0,34.0 -10.4,70.0 -10.4,42.0 52.0,6.0"
    ></polygon><polygon class="ln" points="17.3,-14.0 52.0,6.0 -10.4,42.0 -45.0,22.0"></polygon><polygon
      class="lo"
      points="17.3,-10.0 45.0,6.0 -10.4,38.0 -38.1,22.0"
      opacity="0"
      ><animate
        attributeName="opacity"
        values="0;0;1;1;0;0"
        keyTimes="0;0.7192;0.7308;0.9154;0.9269;1"
        dur="13s"
        repeatCount="indefinite"
      ></animate></polygon
    ><polygon class="lt dash" points="17.3,-6.0 38.1,6.0 26.0,13.0 5.2,1.0" opacity="0"
      ><animate
        attributeName="opacity"
        values="0;0;1;1;0;0"
        keyTimes="0;0.7192;0.7308;0.9154;0.9269;1"
        dur="13s"
        repeatCount="indefinite"
      ></animate></polygon
    ><polygon class="lt dash" points="-0.9,4.5 19.9,16.5 7.8,23.5 -13.0,11.5" opacity="0"
      ><animate
        attributeName="opacity"
        values="0;0;1;1;0;0"
        keyTimes="0;0.7192;0.7308;0.9154;0.9269;1"
        dur="13s"
        repeatCount="indefinite"
      ></animate></polygon
    ><polygon class="lt dash" points="-19.1,15.0 1.7,27.0 -10.4,34.0 -31.2,22.0" opacity="0"
      ><animate
        attributeName="opacity"
        values="0;0;1;1;0;0"
        keyTimes="0;0.7192;0.7308;0.9154;0.9269;1"
        dur="13s"
        repeatCount="indefinite"
      ></animate></polygon
    ><line class="lo" x1="29.4" y1="35.0" x2="12.1" y2="45.0"></line><g
      transform="matrix(0.8660 -0.5000 0 -1 -10.39 80)"
      ><g transform="scale(1 -1)"><text class="tx" x="8" y="-29" style="font-size:6.5px">{certificates}</text></g></g
    ><polygon class="ko" points="-45.0,50.0 -10.4,70.0 -10.4,42.0 -45.0,22.0" opacity="0"
      ><animate
        attributeName="opacity"
        values="0;0;1;1;0;0"
        keyTimes="0;0.6731;0.6846;0.9538;0.9654;1"
        dur="13s"
        repeatCount="indefinite"
      ></animate></polygon
    ><polygon class="ko" points="52.0,34.0 -10.4,70.0 -10.4,42.0 52.0,6.0" opacity="0"
      ><animate
        attributeName="opacity"
        values="0;0;1;1;0;0"
        keyTimes="0;0.6731;0.6846;0.9538;0.9654;1"
        dur="13s"
        repeatCount="indefinite"
      ></animate></polygon
    ><polygon class="ko" points="17.3,-14.0 52.0,6.0 -10.4,42.0 -45.0,22.0" opacity="0"
      ><animate
        attributeName="opacity"
        values="0;0;1;1;0;0"
        keyTimes="0;0.6731;0.6846;0.9538;0.9654;1"
        dur="13s"
        repeatCount="indefinite"
      ></animate></polygon
    ></g
  ><g
    ><animateTransform
      attributeName="transform"
      type="translate"
      values="0.0,0.0;0.0,0.0;36.4,21.0;33.8,19.5;36.4,21.0;36.4,21.0;0.0,0.0;0.0,0.0"
      keyTimes="0;0.3692;0.4385;0.45;0.4615;0.5846;0.6538;1"
      calcMode="spline"
      keySplines=".42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1"
      dur="13s"
      repeatCount="indefinite"
    ></animateTransform><polygon class="ln" points="-45.0,18.0 -10.4,38.0 -10.4,10.0 -45.0,-10.0"></polygon><polygon
      class="ln"
      points="52.0,2.0 -10.4,38.0 -10.4,10.0 52.0,-26.0"
    ></polygon><polygon class="ln" points="17.3,-46.0 52.0,-26.0 -10.4,10.0 -45.0,-10.0"></polygon><polygon
      class="lo"
      points="17.3,-42.0 45.0,-26.0 -10.4,6.0 -38.1,-10.0"
      opacity="0"
      ><animate
        attributeName="opacity"
        values="0;0;1;1;0;0"
        keyTimes="0;0.4115;0.4231;0.6077;0.6192;1"
        dur="13s"
        repeatCount="indefinite"
      ></animate></polygon
    ><polygon class="lt dash" points="17.3,-38.0 38.1,-26.0 26.0,-19.0 5.2,-31.0" opacity="0"
      ><animate
        attributeName="opacity"
        values="0;0;1;1;0;0"
        keyTimes="0;0.4115;0.4231;0.6077;0.6192;1"
        dur="13s"
        repeatCount="indefinite"
      ></animate></polygon
    ><polygon class="lt dash" points="-0.9,-27.5 19.9,-15.5 7.8,-8.5 -13.0,-20.5" opacity="0"
      ><animate
        attributeName="opacity"
        values="0;0;1;1;0;0"
        keyTimes="0;0.4115;0.4231;0.6077;0.6192;1"
        dur="13s"
        repeatCount="indefinite"
      ></animate></polygon
    ><polygon class="lt dash" points="-19.1,-17.0 1.7,-5.0 -10.4,2.0 -31.2,-10.0" opacity="0"
      ><animate
        attributeName="opacity"
        values="0;0;1;1;0;0"
        keyTimes="0;0.4115;0.4231;0.6077;0.6192;1"
        dur="13s"
        repeatCount="indefinite"
      ></animate></polygon
    ><line class="lo" x1="29.4" y1="3.0" x2="12.1" y2="13.0"></line><g transform="matrix(0.8660 -0.5000 0 -1 -10.39 80)"
      ><g transform="scale(1 -1)"><text class="tx" x="8" y="-61" style="font-size:6.5px">{exercises}</text></g></g
    ><polygon class="ko" points="-45.0,18.0 -10.4,38.0 -10.4,10.0 -45.0,-10.0" opacity="0"
      ><animate
        attributeName="opacity"
        values="0;0;1;1;0;0"
        keyTimes="0;0.3654;0.3769;0.6462;0.6577;1"
        dur="13s"
        repeatCount="indefinite"
      ></animate></polygon
    ><polygon class="ko" points="52.0,2.0 -10.4,38.0 -10.4,10.0 52.0,-26.0" opacity="0"
      ><animate
        attributeName="opacity"
        values="0;0;1;1;0;0"
        keyTimes="0;0.3654;0.3769;0.6462;0.6577;1"
        dur="13s"
        repeatCount="indefinite"
      ></animate></polygon
    ><polygon class="ko" points="17.3,-46.0 52.0,-26.0 -10.4,10.0 -45.0,-10.0" opacity="0"
      ><animate
        attributeName="opacity"
        values="0;0;1;1;0;0"
        keyTimes="0;0.3654;0.3769;0.6462;0.6577;1"
        dur="13s"
        repeatCount="indefinite"
      ></animate></polygon
    ></g
  ><g
    ><animateTransform
      attributeName="transform"
      type="translate"
      values="0.0,0.0;0.0,0.0;36.4,21.0;33.8,19.5;36.4,21.0;36.4,21.0;0.0,0.0;0.0,0.0"
      keyTimes="0;0.0615;0.1308;0.1423;0.1538;0.2769;0.3462;1"
      calcMode="spline"
      keySplines=".42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1"
      dur="13s"
      repeatCount="indefinite"
    ></animateTransform><polygon class="ln" points="-45.0,-14.0 -10.4,6.0 -10.4,-22.0 -45.0,-42.0"></polygon><polygon
      class="ln"
      points="52.0,-30.0 -10.4,6.0 -10.4,-22.0 52.0,-58.0"
    ></polygon><polygon class="ln" points="17.3,-78.0 52.0,-58.0 -10.4,-22.0 -45.0,-42.0"></polygon><polygon
      class="lo"
      points="17.3,-74.0 45.0,-58.0 -10.4,-26.0 -38.1,-42.0"
      opacity="0"
      ><animate
        attributeName="opacity"
        values="0;0;1;1;0;0"
        keyTimes="0;0.1038;0.1154;0.3;0.3115;1"
        dur="13s"
        repeatCount="indefinite"
      ></animate></polygon
    ><polygon class="lt dash" points="17.3,-70.0 38.1,-58.0 26.0,-51.0 5.2,-63.0" opacity="0"
      ><animate
        attributeName="opacity"
        values="0;0;1;1;0;0"
        keyTimes="0;0.1038;0.1154;0.3;0.3115;1"
        dur="13s"
        repeatCount="indefinite"
      ></animate></polygon
    ><polygon class="lt dash" points="-0.9,-59.5 19.9,-47.5 7.8,-40.5 -13.0,-52.5" opacity="0"
      ><animate
        attributeName="opacity"
        values="0;0;1;1;0;0"
        keyTimes="0;0.1038;0.1154;0.3;0.3115;1"
        dur="13s"
        repeatCount="indefinite"
      ></animate></polygon
    ><polygon class="lt dash" points="-19.1,-49.0 1.7,-37.0 -10.4,-30.0 -31.2,-42.0" opacity="0"
      ><animate
        attributeName="opacity"
        values="0;0;1;1;0;0"
        keyTimes="0;0.1038;0.1154;0.3;0.3115;1"
        dur="13s"
        repeatCount="indefinite"
      ></animate></polygon
    ><line class="lo" x1="29.4" y1="-29.0" x2="12.1" y2="-19.0"></line><g
      transform="matrix(0.8660 -0.5000 0 -1 -10.39 80)"
      ><g transform="scale(1 -1)"><text class="tx" x="8" y="-93" style="font-size:6.5px">{lessons}</text></g></g
    ><polygon class="ko" points="-45.0,-14.0 -10.4,6.0 -10.4,-22.0 -45.0,-42.0" opacity="0"
      ><animate
        attributeName="opacity"
        values="0;0;1;1;0;0"
        keyTimes="0;0.0577;0.0692;0.3385;0.35;1"
        dur="13s"
        repeatCount="indefinite"
      ></animate></polygon
    ><polygon class="ko" points="52.0,-30.0 -10.4,6.0 -10.4,-22.0 52.0,-58.0" opacity="0"
      ><animate
        attributeName="opacity"
        values="0;0;1;1;0;0"
        keyTimes="0;0.0577;0.0692;0.3385;0.35;1"
        dur="13s"
        repeatCount="indefinite"
      ></animate></polygon
    ><polygon class="ko" points="17.3,-78.0 52.0,-58.0 -10.4,-22.0 -45.0,-42.0" opacity="0"
      ><animate
        attributeName="opacity"
        values="0;0;1;1;0;0"
        keyTimes="0;0.0577;0.0692;0.3385;0.35;1"
        dur="13s"
        repeatCount="indefinite"
      ></animate></polygon
    ></g
  ><polygon class="ln" points="-67.5,-53.0 -12.1,-21.0 -12.1,-27.0 -67.5,-59.0"></polygon><polygon
    class="ln"
    points="53.7,-59.0 -12.1,-21.0 -12.1,-27.0 53.7,-65.0"
  ></polygon><polygon class="ln" points="-1.7,-97.0 53.7,-65.0 -12.1,-27.0 -67.5,-59.0"></polygon>
</MachineFrame>
