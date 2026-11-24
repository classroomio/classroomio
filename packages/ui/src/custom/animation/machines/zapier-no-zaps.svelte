<script lang="ts">
  import MachineFrame from './machine-frame.svelte';
  import type { MachineProps } from './types';

  let { label, stillAt = 2.5, class: className }: MachineProps = $props();
</script>

<MachineFrame viewBox="-44 -114 313 292" {label} {stillAt} class={className}>
  <polygon class="ln" points="-26.0,15.0 225.2,160.0 225.2,154.0 -26.0,9.0"></polygon><polygon
    class="ln"
    points="251.1,145.0 225.2,160.0 225.2,154.0 251.1,139.0"
  ></polygon><polygon class="ln" points="0.0,-6.0 251.1,139.0 225.2,154.0 -26.0,9.0"></polygon><polygon
    class="ln"
    points="-6.9,-2.0 244.2,143.0 244.2,53.0 -6.9,-92.0"
  ></polygon><polygon class="ln" points="251.1,139.0 244.2,143.0 244.2,53.0 251.1,49.0"></polygon><polygon
    class="ln"
    points="0.0,-96.0 251.1,49.0 244.2,53.0 -6.9,-92.0"
  ></polygon><g transform="matrix(0.8660 0.5000 0 -1 -6.9 4.0)"
    ><circle class="lo" cx="40" cy="48" r="8"></circle><circle class="lt" cx="40" cy="48" r="3"></circle><circle
      class="lo"
      cx="116"
      cy="48"
      r="8"
    ></circle><circle class="lt" cx="116" cy="48" r="3"></circle><circle class="lo" cx="164" cy="48" r="8"
    ></circle><circle class="lt" cx="164" cy="48" r="3"></circle><circle class="lo" cx="236" cy="70" r="8"
    ></circle><circle class="lt" cx="236" cy="70" r="3"></circle><circle class="lo" cx="236" cy="48" r="8"
    ></circle><circle class="lt" cx="236" cy="48" r="3"></circle><circle class="lo" cx="236" cy="26" r="8"
    ></circle><circle class="lt" cx="236" cy="26" r="3"></circle><rect
      class="lo"
      x="98"
      y="12"
      width="84"
      height="78"
      rx="6"
    ></rect><line class="lt dash" x1="126" y1="48" x2="154" y2="48"></line><g transform="scale(1 -1)"
      ><text class="tx" x="12" y="-68" style="font-size: 8px; letter-spacing: 0.06em">CLASSROOMIO</text><text
        class="tx"
        x="126"
        y="-78"
        style="font-size: 8px; letter-spacing: 0.06em">ZAPIER</text
      ><text class="tx" x="248" y="-68" style="font-size: 8px; letter-spacing: 0.06em">SLACK</text><text
        class="tx"
        x="248"
        y="-46"
        style="font-size: 8px; letter-spacing: 0.06em">HUBSPOT</text
      ><text class="tx" x="248" y="-24" style="font-size: 8px; letter-spacing: 0.06em">EMAIL</text></g
    ><path class="ko" d="M40 48 C58 38 98 38 116 48"></path><circle class="kf" cx="40" cy="48" r="3.2"></circle><circle
      class="kf"
      cx="116"
      cy="48"
      r="3.2"
    ></circle><circle class="kf" cx="164" cy="48" r="3.2"></circle><rect
      class="ko"
      x="98"
      y="12"
      width="84"
      height="78"
      rx="6"
      opacity="0"
      ><animate
        attributeName="opacity"
        values="0;0;1;1;0;0;1;1;0;0;1;1;0;0;1;1;0;0;1;1;0;0;1;1;0;0"
        keyTimes="0;0.1521;0.1607;0.1964;0.205;0.2521;0.2607;0.2964;0.305;0.4236;0.4321;0.4679;0.4764;0.5236;0.5321;0.5679;0.5764;0.695;0.7036;0.7393;0.7479;0.795;0.8036;0.8393;0.8479;1"
        dur="14s"
        repeatCount="indefinite"
      ></animate></rect
    ><circle class="ko" cx="236" cy="70" r="10" opacity="0"
      ><animate
        attributeName="opacity"
        values="0;0;1;1;0;0"
        keyTimes="0;0.1057;0.1143;0.3286;0.3371;1"
        dur="14s"
        repeatCount="indefinite"
      ></animate></circle
    ><circle class="ko" cx="236" cy="48" r="10" opacity="0"
      ><animate
        attributeName="opacity"
        values="0;0;1;1;0;0"
        keyTimes="0;0.3771;0.3857;0.6;0.6086;1"
        dur="14s"
        repeatCount="indefinite"
      ></animate></circle
    ><circle class="ko" cx="236" cy="26" r="10" opacity="0"
      ><animate
        attributeName="opacity"
        values="0;0;1;1;0;0"
        keyTimes="0;0.6486;0.6571;0.8714;0.88;1"
        dur="14s"
        repeatCount="indefinite"
      ></animate></circle
    ><circle class="ko" cx="40" cy="48" r="10" opacity="0"
      ><animate
        attributeName="opacity"
        values="0;0;1;1;0;0;1;1;0;0;1;1;0;0"
        keyTimes="0;0.3057;0.3143;0.3571;0.3657;0.5771;0.5857;0.6286;0.6371;0.8486;0.8571;0.9;0.9086;1"
        dur="14s"
        repeatCount="indefinite"
      ></animate></circle
    ><path class="ko" d="M164 48 C194 18.0 160.0 -14.0 190.0 16.0"
      ><animate
        attributeName="d"
        values="M164 48 C194 18.0 160.0 -14.0 190.0 16.0;M164 48 C194 20.0 170.0 6.0 200.0 34.0;M164 48 C194 36.0 206.0 58.0 236.0 70.0;M164 48 C194 36.0 206.0 58.0 236.0 70.0;M164 48 C194 26.0 182.0 38.0 212.0 60.0;M164 48 C194 36.0 206.0 36.0 236.0 48.0;M164 48 C194 36.0 206.0 36.0 236.0 48.0;M164 48 C194 26.0 182.0 16.0 212.0 38.0;M164 48 C194 36.0 206.0 14.0 236.0 26.0;M164 48 C194 36.0 206.0 14.0 236.0 26.0;M164 48 C194 20.0 182.0 -8.0 212.0 20.0;M164 48 C194 18.0 160.0 -14.0 190.0 16.0"
        keyTimes="0;0.0571;0.1143;0.3286;0.3571;0.3857;0.6;0.6286;0.6571;0.8714;0.9143;1"
        calcMode="spline"
        keySplines=".42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1"
        dur="14s"
        repeatCount="indefinite"
      ></animate></path
    ><circle class="kf" r="3.2" opacity="0"
      ><animateMotion
        dur="14s"
        repeatCount="indefinite"
        path="M40 48 C58 38 98 38 116 48 L164 48 C194 36 206 58 236 70"
        keyPoints="0;0;1;1"
        keyTimes="0;0.1357;0.2214;1"
        calcMode="linear"
      ></animateMotion><animate
        attributeName="opacity"
        values="0;0;1;1;0;0"
        keyTimes="0;0.1357;0.1393;0.2179;0.2214;1"
        dur="14s"
        repeatCount="indefinite"
      ></animate></circle
    ><circle class="ink" r="3.2" opacity="0"
      ><animateMotion
        dur="14s"
        repeatCount="indefinite"
        path="M40 48 C58 38 98 38 116 48 L164 48 C194 36 206 58 236 70"
        keyPoints="1;1;0;0"
        keyTimes="0;0.2357;0.3214;1"
        calcMode="linear"
      ></animateMotion><animate
        attributeName="opacity"
        values="0;0;1;1;0;0"
        keyTimes="0;0.2357;0.2393;0.3179;0.3214;1"
        dur="14s"
        repeatCount="indefinite"
      ></animate></circle
    ><circle class="kf" r="3.2" opacity="0"
      ><animateMotion
        dur="14s"
        repeatCount="indefinite"
        path="M40 48 C58 38 98 38 116 48 L164 48 C194 36 206 36 236 48"
        keyPoints="0;0;1;1"
        keyTimes="0;0.4071;0.4929;1"
        calcMode="linear"
      ></animateMotion><animate
        attributeName="opacity"
        values="0;0;1;1;0;0"
        keyTimes="0;0.4071;0.4107;0.4893;0.4929;1"
        dur="14s"
        repeatCount="indefinite"
      ></animate></circle
    ><circle class="ink" r="3.2" opacity="0"
      ><animateMotion
        dur="14s"
        repeatCount="indefinite"
        path="M40 48 C58 38 98 38 116 48 L164 48 C194 36 206 36 236 48"
        keyPoints="1;1;0;0"
        keyTimes="0;0.5071;0.5929;1"
        calcMode="linear"
      ></animateMotion><animate
        attributeName="opacity"
        values="0;0;1;1;0;0"
        keyTimes="0;0.5071;0.5107;0.5893;0.5929;1"
        dur="14s"
        repeatCount="indefinite"
      ></animate></circle
    ><circle class="kf" r="3.2" opacity="0"
      ><animateMotion
        dur="14s"
        repeatCount="indefinite"
        path="M40 48 C58 38 98 38 116 48 L164 48 C194 36 206 14 236 26"
        keyPoints="0;0;1;1"
        keyTimes="0;0.6786;0.7643;1"
        calcMode="linear"
      ></animateMotion><animate
        attributeName="opacity"
        values="0;0;1;1;0;0"
        keyTimes="0;0.6786;0.6821;0.7607;0.7643;1"
        dur="14s"
        repeatCount="indefinite"
      ></animate></circle
    ><circle class="ink" r="3.2" opacity="0"
      ><animateMotion
        dur="14s"
        repeatCount="indefinite"
        path="M40 48 C58 38 98 38 116 48 L164 48 C194 36 206 14 236 26"
        keyPoints="1;1;0;0"
        keyTimes="0;0.7786;0.8643;1"
        calcMode="linear"
      ></animateMotion><animate
        attributeName="opacity"
        values="0;0;1;1;0;0"
        keyTimes="0;0.7786;0.7821;0.8607;0.8643;1"
        dur="14s"
        repeatCount="indefinite"
      ></animate></circle
    ><g
      ><animateTransform
        attributeName="transform"
        type="translate"
        values="190.0,16.0;200.0,34.0;236.0,70.0;236.0,70.0;212.0,60.0;236.0,48.0;236.0,48.0;212.0,38.0;236.0,26.0;236.0,26.0;212.0,20.0;190.0,16.0"
        keyTimes="0;0.0571;0.1143;0.3286;0.3571;0.3857;0.6;0.6286;0.6571;0.8714;0.9143;1"
        calcMode="spline"
        keySplines=".42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1"
        dur="14s"
        repeatCount="indefinite"
      ></animateTransform><rect class="ink" x="-8" y="-4.5" width="16" height="9" rx="2.5"></rect><circle
        class="kf"
        cx="-2"
        cy="0"
        r="2"
      ></circle></g
    ></g
  >
</MachineFrame>
