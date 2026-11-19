<script lang="ts">
  import MachineFrame from './machine-frame.svelte';
  import type { MachineProps } from './types';

  let { label, stillAt, class: className }: MachineProps = $props();
</script>

<MachineFrame viewBox="-105 -56 508 335" {label} {stillAt} class={className}>
  <polyline class="lo" points="57.2,62.0 220.8,156.5 286.7,118.5"></polyline><polyline
    class="lo"
    points="26.0,80.0 90.1,117.0 17.3,159.0 86.6,199.0"
  ></polyline><polygon class="ln" points="83.1,48.0 0.0,96.0 0.0,62.0 83.1,14.0"></polygon><polygon
    class="ln"
    points="-83.1,48.0 0.0,96.0 0.0,62.0 -83.1,14.0"
  ></polygon><polygon class="ln" points="0.0,-34.0 83.1,14.0 0.0,62.0 -83.1,14.0"></polygon><g
    transform="matrix(0.8660 0.5000 -0.8660 0.5000 0.0 -34.0)"
    ><rect class="lo" x="10" y="12" width="20" height="14" rx="1.5"></rect><rect
      class="lo"
      x="36"
      y="12"
      width="20"
      height="14"
      rx="1.5"
    ></rect><rect class="lo" x="62" y="12" width="20" height="14" rx="1.5"></rect><line
      class="lt"
      x1="30"
      y1="19"
      x2="36"
      y2="19"
    ></line><line class="lt" x1="56" y1="19" x2="62" y2="19"></line><rect
      class="ink"
      x="54"
      y="50"
      width="30"
      height="22"
      rx="1.5"
    ></rect><circle class="kf" cx="76" cy="65" r="3.4"></circle><line class="ko" x1="59" y1="57" x2="72" y2="57"
    ></line></g
  ><g transform="matrix(0.8660 0.5000 0.0000 1.0000 -83.1 14.0)"
    ><text class="tx" x="10" y="20" style="font-size: 7.5px;">ClassroomIO</text></g
  ><g opacity="0"
    ><animateMotion
      path="M26.0 80.0 L90.1 117.0 L17.3 159.0 L86.6 199.0"
      dur="8s"
      begin="0.000s"
      repeatCount="indefinite"
      keyPoints="0;0.5;0.5"
      keyTimes="0;0.3;1"
      calcMode="linear"
    ></animateMotion><animate
      attributeName="opacity"
      values="1;0;1;0;1;0"
      keyTimes="0;0.3;0.33;0.36;0.39;0.42"
      dur="8s"
      begin="0.000s"
      calcMode="discrete"
      repeatCount="indefinite"
    ></animate><polygon class="ink" points="8.7,-1.0 0.0,4.0 0.0,-4.0 8.7,-9.0"></polygon><polygon
      class="ink"
      points="-8.7,-1.0 0.0,4.0 0.0,-4.0 -8.7,-9.0"
    ></polygon><polygon class="ink" points="0.0,-14.0 8.7,-9.0 0.0,-4.0 -8.7,-9.0"></polygon><text
      class="tk"
      x="10"
      y="-12"
      style="font-size: 7px;">certificate.issued</text
    ></g
  ><g opacity="0"
    ><animate
      attributeName="opacity"
      values="0;1;0"
      keyTimes="0;0.3;0.48"
      dur="8s"
      begin="0.000s"
      calcMode="discrete"
      repeatCount="indefinite"
    ></animate><text class="tx" x="65.7" y="158.0" style="font-size: 7px;">no response</text></g
  ><g opacity="0"
    ><animateMotion
      path="M26.0 80.0 L90.1 117.0 L17.3 159.0 L86.6 199.0"
      dur="8s"
      begin="0.000s"
      repeatCount="indefinite"
      keyPoints="0;0;1;1"
      keyTimes="0;0.48;0.82;1"
      calcMode="linear"
    ></animateMotion><animate
      attributeName="opacity"
      values="0;1;0"
      keyTimes="0;0.48;0.82"
      dur="8s"
      begin="0.000s"
      calcMode="discrete"
      repeatCount="indefinite"
    ></animate><polygon class="ink" points="8.7,-1.0 0.0,4.0 0.0,-4.0 8.7,-9.0"></polygon><polygon
      class="ink"
      points="-8.7,-1.0 0.0,4.0 0.0,-4.0 -8.7,-9.0"
    ></polygon><polygon class="ink" points="0.0,-14.0 8.7,-9.0 0.0,-4.0 -8.7,-9.0"></polygon><text
      class="tk"
      x="10"
      y="-12"
      style="font-size: 7px;">retry 1</text
    ></g
  ><polygon class="ln" points="181.9,225.0 126.4,257.0 126.4,217.0 181.9,185.0"></polygon><polygon
    class="ln"
    points="57.2,217.0 126.4,257.0 126.4,217.0 57.2,177.0"
  ></polygon><polygon class="ln" points="112.6,145.0 181.9,185.0 126.4,217.0 57.2,177.0"></polygon><g
    transform="matrix(0.8660 0.5000 0.0000 1.0000 57.2 177.0)"
    ><text class="tx" x="8" y="18" style="font-size: 7.5px;">Help desk</text></g
  ><g transform="matrix(0.8660 0.5000 -0.8660 0.5000 112.6 145.0)"
    ><line class="lt" x1="10" y1="12" x2="66" y2="12"></line><line class="lt" x1="10" y1="24" x2="56" y2="24"
    ></line><line class="lt" x1="10" y1="36" x2="46" y2="36"></line><line class="lt" x1="10" y1="48" x2="36" y2="48"
    ></line></g
  ><g opacity="0"
    ><animate
      attributeName="opacity"
      values="0;0;1;0;0"
      keyTimes="0;0.82;0.85;0.97;1"
      dur="8s"
      begin="0.000s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animate><polygon class="ko" points="112.6,145.0 181.9,185.0 126.4,217.0 57.2,177.0"></polygon></g
  ><g opacity="0"
    ><animateMotion
      path="M57.2 62.0 L220.8 156.5 L286.7 118.5"
      dur="8s"
      begin="-1.000s"
      repeatCount="indefinite"
      keyPoints="0;1;1"
      keyTimes="0;0.3;1"
      calcMode="linear"
    ></animateMotion><animate
      attributeName="opacity"
      values="1;0"
      keyTimes="0;0.3"
      dur="8s"
      begin="-1.000s"
      calcMode="discrete"
      repeatCount="indefinite"
    ></animate><polygon class="ink" points="8.7,-1.0 0.0,4.0 0.0,-4.0 8.7,-9.0"></polygon><polygon
      class="ink"
      points="-8.7,-1.0 0.0,4.0 0.0,-4.0 -8.7,-9.0"
    ></polygon><polygon class="ink" points="0.0,-14.0 8.7,-9.0 0.0,-4.0 -8.7,-9.0"></polygon><text
      class="tk"
      x="10"
      y="-12"
      style="font-size: 7px;">course.completed</text
    ></g
  ><g opacity="0"
    ><animateMotion
      path="M57.2 62.0 L220.8 156.5 L286.7 118.5"
      dur="8s"
      begin="-3.000s"
      repeatCount="indefinite"
      keyPoints="0;1;1"
      keyTimes="0;0.3;1"
      calcMode="linear"
    ></animateMotion><animate
      attributeName="opacity"
      values="1;0"
      keyTimes="0;0.3"
      dur="8s"
      begin="-3.000s"
      calcMode="discrete"
      repeatCount="indefinite"
    ></animate><polygon class="ink" points="8.7,-1.0 0.0,4.0 0.0,-4.0 8.7,-9.0"></polygon><polygon
      class="ink"
      points="-8.7,-1.0 0.0,4.0 0.0,-4.0 -8.7,-9.0"
    ></polygon><polygon class="ink" points="0.0,-14.0 8.7,-9.0 0.0,-4.0 -8.7,-9.0"></polygon><text
      class="tk"
      x="10"
      y="-12"
      style="font-size: 7px;">learner.enrolled</text
    ></g
  ><polygon class="ln" points="381.1,110.0 325.6,142.0 325.6,102.0 381.1,70.0"></polygon><polygon
    class="ln"
    points="256.3,102.0 325.6,142.0 325.6,102.0 256.3,62.0"
  ></polygon><polygon class="ln" points="311.8,30.0 381.1,70.0 325.6,102.0 256.3,62.0"></polygon><g
    transform="matrix(0.8660 0.5000 -0.8660 0.5000 311.8 30.0)"
    ><circle class="lo" cx="12" cy="13" r="4"></circle><line class="lt" x1="22" y1="13" x2="56" y2="13"></line><circle
      class="lo"
      cx="12"
      cy="29"
      r="4"
    ></circle><line class="lt" x1="22" y1="29" x2="48" y2="29"></line><circle class="lo" cx="12" cy="45" r="4"
    ></circle><line class="lt" x1="22" y1="45" x2="40" y2="45"></line></g
  ><g transform="matrix(0.8660 0.5000 0.0000 1.0000 256.3 62.0)"
    ><text class="tx" x="8" y="18" style="font-size: 7.5px;">CRM</text></g
  ><g opacity="0"
    ><animate
      attributeName="opacity"
      values="0;0;1;0;0"
      keyTimes="0;0.3;0.32;0.45;1"
      dur="8s"
      begin="-1.000s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animate><polygon class="ko" points="311.8,30.0 381.1,70.0 325.6,102.0 256.3,62.0"></polygon></g
  ><g opacity="0"
    ><animate
      attributeName="opacity"
      values="0;0;1;0;0"
      keyTimes="0;0.3;0.32;0.45;1"
      dur="8s"
      begin="-3.000s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animate><polygon class="ko" points="311.8,30.0 381.1,70.0 325.6,102.0 256.3,62.0"></polygon></g
  >
</MachineFrame>
