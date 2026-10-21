<script lang="ts">
  import MachineFrame from './machine-frame.svelte';
  import type { MachineProps } from './types';

  let { label, stillAt, class: className }: MachineProps = $props();
</script>

<MachineFrame viewBox="-84 -346 391 489" {label} {stillAt} class={className}>
  <polygon class="ln" points="161.1,85.0 98.7,121.0 98.7,113.0 161.1,77.0"></polygon><polygon
    class="ln"
    points="-62.4,28.0 98.7,121.0 98.7,113.0 -62.4,20.0"
  ></polygon><polygon class="ln" points="0.0,-16.0 161.1,77.0 98.7,113.0 -62.4,20.0"></polygon><polygon
    class="ln"
    points="3.5,-6.0 0.0,-4.0 0.0,-302.0 3.5,-304.0"
  ></polygon><polygon class="ln" points="-3.5,-6.0 0.0,-4.0 0.0,-302.0 -3.5,-304.0"></polygon><polygon
    class="ln"
    points="0.0,-306.0 3.5,-304.0 0.0,-302.0 -3.5,-304.0"
  ></polygon><polygon class="ln" points="46.8,19.0 43.3,21.0 43.3,-277.0 46.8,-279.0"></polygon><polygon
    class="ln"
    points="39.8,19.0 43.3,21.0 43.3,-277.0 39.8,-279.0"
  ></polygon><polygon class="ln" points="43.3,-281.0 46.8,-279.0 43.3,-277.0 39.8,-279.0"></polygon><polygon
    class="ln"
    points="-39.8,19.0 -43.3,21.0 -43.3,-277.0 -39.8,-279.0"
  ></polygon><polygon class="ln" points="-46.8,19.0 -43.3,21.0 -43.3,-277.0 -46.8,-279.0"></polygon><polygon
    class="ln"
    points="-43.3,-281.0 -39.8,-279.0 -43.3,-277.0 -46.8,-279.0"
  ></polygon><line class="lo" x1="0.0" y1="-281.0" x2="0.0" y2="-29.0"
    ><animate
      attributeName="y2"
      values="-29.0;-29.0;-87.0;-87.0;-145.0;-145.0;-203.0;-203.0;-261.0;-261.0;-261.0;-29.0;-29.0;-29.0"
      keyTimes="0;0.0857;0.1429;0.2286;0.2857;0.3714;0.4286;0.5143;0.5714;0.7857;0.8143;0.8857;0.9143;1"
      dur="14s"
      begin="0.000s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animate></line
  ><g
    ><animateTransform
      attributeName="transform"
      type="translate"
      values="0 0;0 0;0 -58;0 -58;0 -116;0 -116;0 -174;0 -174;0 -232;0 -232;0 -232;0 0;0 0;0 0"
      dur="14s"
      begin="0.000s"
      keyTimes="0;0.0857;0.1429;0.2286;0.2857;0.3714;0.4286;0.5143;0.5714;0.7857;0.8143;0.8857;0.9143;1"
      calcMode="linear"
      repeatCount="indefinite"
    ></animateTransform><animate
      attributeName="opacity"
      values="1;1;1;1;1;1;1;1;1;1;0;0;1;1"
      keyTimes="0;0.0857;0.1429;0.2286;0.2857;0.3714;0.4286;0.5143;0.5714;0.7857;0.8143;0.8857;0.9143;1"
      dur="14s"
      begin="0.000s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animate><g
      ><animate
        attributeName="opacity"
        values="1;0;1"
        keyTimes="0;0.4286;0.8857"
        dur="14s"
        begin="0.000s"
        calcMode="discrete"
        repeatCount="indefinite"
      ></animate><polygon class="ln" points="32.9,17.0 0.0,36.0 0.0,-10.0 32.9,-29.0"></polygon><polygon
        class="ln"
        points="-32.9,17.0 0.0,36.0 0.0,-10.0 -32.9,-29.0"
      ></polygon><polygon class="ln" points="0.0,-48.0 32.9,-29.0 0.0,-10.0 -32.9,-29.0"></polygon><circle
        class="dot"
        cx="0.0"
        cy="-33.9"
        r=".8"
      ></circle><circle class="dot" cx="-4.3" cy="-31.5" r=".8"></circle><circle class="dot" cx="-8.6" cy="-29.0" r=".8"
      ></circle><circle class="dot" cx="4.3" cy="-31.5" r=".8"></circle><circle class="dot" cx="0.0" cy="-29.0" r=".8"
      ></circle><circle class="dot" cx="-4.3" cy="-26.5" r=".8"></circle><circle class="dot" cx="8.6" cy="-29.0" r=".8"
      ></circle><circle class="dot" cx="4.3" cy="-26.5" r=".8"></circle><circle class="dot" cx="0.0" cy="-24.1" r=".8"
      ></circle><g transform="matrix(0.8660 0.5000 0.0000 1.0000 -32.9 -29.0)"
        ><rect class="lo" x="9" y="10" width="20" height="16" rx="1.5"></rect></g
      ></g
    ><g opacity="0"
      ><animate
        attributeName="opacity"
        values="0;1;0"
        keyTimes="0;0.4286;0.8857"
        dur="14s"
        begin="0.000s"
        calcMode="discrete"
        repeatCount="indefinite"
      ></animate><polygon class="ink" points="32.9,17.0 0.0,36.0 0.0,-10.0 32.9,-29.0"></polygon><polygon
        class="ink"
        points="-32.9,17.0 0.0,36.0 0.0,-10.0 -32.9,-29.0"
      ></polygon><polygon class="ink" points="0.0,-48.0 32.9,-29.0 0.0,-10.0 -32.9,-29.0"></polygon><circle
        class="kf"
        cx="0.0"
        cy="-33.9"
        r=".8"
      ></circle><circle class="kf" cx="-4.3" cy="-31.5" r=".8"></circle><circle class="kf" cx="-8.6" cy="-29.0" r=".8"
      ></circle><circle class="kf" cx="4.3" cy="-31.5" r=".8"></circle><circle class="kf" cx="0.0" cy="-29.0" r=".8"
      ></circle><circle class="kf" cx="-4.3" cy="-26.5" r=".8"></circle><circle class="kf" cx="8.6" cy="-29.0" r=".8"
      ></circle><circle class="kf" cx="4.3" cy="-26.5" r=".8"></circle><circle class="kf" cx="0.0" cy="-24.1" r=".8"
      ></circle><g transform="matrix(0.8660 0.5000 0.0000 1.0000 -32.9 -29.0)"
        ><rect class="ko" x="9" y="10" width="20" height="16" rx="1.5"></rect></g
      ></g
    ></g
  ><polygon class="ln" points="3.5,44.0 0.0,46.0 0.0,-252.0 3.5,-254.0"></polygon><polygon
    class="ln"
    points="-3.5,44.0 0.0,46.0 0.0,-252.0 -3.5,-254.0"
  ></polygon><polygon class="ln" points="0.0,-256.0 3.5,-254.0 0.0,-252.0 -3.5,-254.0"></polygon><polygon
    class="ln"
    points="53.7,-279.0 0.0,-248.0 0.0,-256.0 53.7,-287.0"
  ></polygon><polygon class="ln" points="-53.7,-279.0 0.0,-248.0 0.0,-256.0 -53.7,-287.0"></polygon><polygon
    class="ln"
    points="0.0,-318.0 53.7,-287.0 0.0,-256.0 -53.7,-287.0"
  ></polygon><polygon class="ln" points="10.4,-287.0 0.0,-281.0 0.0,-286.0 10.4,-292.0"></polygon><polygon
    class="ln"
    points="-10.4,-287.0 0.0,-281.0 0.0,-286.0 -10.4,-292.0"
  ></polygon><polygon class="ln" points="0.0,-298.0 10.4,-292.0 0.0,-286.0 -10.4,-292.0"></polygon><g
    transform="matrix(0.8660 0.5000 0.0000 1.0000 -23.4 -305.5)"
    ><circle class="ln" cx="27" cy="-21" r="15"></circle><circle class="lo" cx="27" cy="-21" r="12"></circle><g
      ><animateTransform
        attributeName="transform"
        type="rotate"
        values="0 27 -21;0 27 -21;140 27 -21;140 27 -21;280 27 -21;280 27 -21;420 27 -21;420 27 -21;560 27 -21;560 27 -21;560 27 -21;0 27 -21;0 27 -21;0 27 -21"
        dur="14s"
        begin="0.000s"
        keyTimes="0;0.0857;0.1429;0.2286;0.2857;0.3714;0.4286;0.5143;0.5714;0.7857;0.8143;0.8857;0.9143;1"
        calcMode="linear"
        repeatCount="indefinite"
      ></animateTransform><line class="lt" x1="27" y1="-21" x2="39.0" y2="-21.0"></line><line
        class="lt"
        x1="27"
        y1="-21"
        x2="33.0"
        y2="-10.6"
      ></line><line class="lt" x1="27" y1="-21" x2="21.0" y2="-10.6"></line><line
        class="lt"
        x1="27"
        y1="-21"
        x2="15.0"
        y2="-21.0"
      ></line><line class="lt" x1="27" y1="-21" x2="21.0" y2="-31.4"></line><line
        class="lt"
        x1="27"
        y1="-21"
        x2="33.0"
        y2="-31.4"
      ></line></g
    ><circle class="dot" cx="27" cy="-21" r="1.5"></circle></g
  ><polygon class="ln" points="147.2,79.0 102.2,105.0 102.2,102.0 147.2,76.0"></polygon><polygon
    class="ln"
    points="5.2,49.0 102.2,105.0 102.2,102.0 5.2,46.0"
  ></polygon><polygon class="ln" points="50.2,20.0 147.2,76.0 102.2,102.0 5.2,46.0"></polygon><g
    transform="matrix(0.8660 0.5000 -0.8660 0.5000 71.0 40.0)"
    ><path class="lo" d="M4 4 H40 V22 H16 L9 28 V22 H4 Z"></path><line class="lt" x1="9" y1="10" x2="34" y2="10"
    ></line><line class="lt" x1="9" y1="16" x2="28" y2="16"></line></g
  ><polygon class="ln" points="140.3,76.0 136.8,78.0 136.8,23.0 140.3,21.0"></polygon><polygon
    class="ln"
    points="133.4,76.0 136.8,78.0 136.8,23.0 133.4,21.0"
  ></polygon><polygon class="ln" points="136.8,19.0 140.3,21.0 136.8,23.0 133.4,21.0"></polygon><polygon
    class="ln"
    points="107.4,95.0 103.9,97.0 103.9,42.0 107.4,40.0"
  ></polygon><polygon class="ln" points="100.5,95.0 103.9,97.0 103.9,42.0 100.5,40.0"></polygon><polygon
    class="ln"
    points="103.9,38.0 107.4,40.0 103.9,42.0 100.5,40.0"
  ></polygon><text class="tx" x="161.2" y="77.0" text-anchor="start">1 Reactive help</text><polygon
    class="ln"
    points="147.2,21.0 102.2,47.0 102.2,42.0 147.2,16.0"
  ></polygon><polygon class="ln" points="5.2,-9.0 102.2,47.0 102.2,42.0 5.2,-14.0"></polygon><polygon
    class="ln"
    points="50.2,-40.0 147.2,16.0 102.2,42.0 5.2,-14.0"
  ></polygon><g transform="matrix(0.8660 0.5000 -0.8660 0.5000 71.0 -20.0)"
    ><rect class="lo" x="6" y="2" width="30" height="30" rx="1.5"></rect><line class="lt" x1="11" y1="9" x2="31" y2="9"
    ></line><line class="lt" x1="11" y1="15" x2="24" y2="15"></line><line class="lt" x1="11" y1="21" x2="31" y2="21"
    ></line><line class="lt" x1="11" y1="27" x2="24" y2="27"></line></g
  ><polygon class="ln" points="140.3,16.0 136.8,18.0 136.8,-35.0 140.3,-37.0"></polygon><polygon
    class="ln"
    points="133.4,16.0 136.8,18.0 136.8,-35.0 133.4,-37.0"
  ></polygon><polygon class="ln" points="136.8,-39.0 140.3,-37.0 136.8,-35.0 133.4,-37.0"></polygon><polygon
    class="ln"
    points="107.4,35.0 103.9,37.0 103.9,-16.0 107.4,-18.0"
  ></polygon><polygon class="ln" points="100.5,35.0 103.9,37.0 103.9,-16.0 100.5,-18.0"></polygon><polygon
    class="ln"
    points="103.9,-20.0 107.4,-18.0 103.9,-16.0 100.5,-18.0"
  ></polygon><text class="tx" x="161.2" y="19.0" text-anchor="start">2 Published reference</text><polygon
    class="ln"
    points="147.2,-37.0 102.2,-11.0 102.2,-16.0 147.2,-42.0"
  ></polygon><polygon class="ln" points="5.2,-67.0 102.2,-11.0 102.2,-16.0 5.2,-72.0"></polygon><polygon
    class="ln"
    points="50.2,-98.0 147.2,-42.0 102.2,-16.0 5.2,-72.0"
  ></polygon><g transform="matrix(0.8660 0.5000 -0.8660 0.5000 71.0 -78.0)"
    ><rect class="lo" x="3" y="11" width="10" height="10" rx="1.5"></rect><rect
      class="lo"
      x="18"
      y="11"
      width="10"
      height="10"
      rx="1.5"
    ></rect><rect class="lo" x="33" y="11" width="10" height="10" rx="1.5"></rect><line
      class="lt"
      x1="13"
      y1="16"
      x2="18"
      y2="16"
    ></line><line class="lt" x1="28" y1="16" x2="33" y2="16"></line></g
  ><polygon class="ln" points="140.3,-42.0 136.8,-40.0 136.8,-93.0 140.3,-95.0"></polygon><polygon
    class="ln"
    points="133.4,-42.0 136.8,-40.0 136.8,-93.0 133.4,-95.0"
  ></polygon><polygon class="ln" points="136.8,-97.0 140.3,-95.0 136.8,-93.0 133.4,-95.0"></polygon><polygon
    class="ln"
    points="107.4,-23.0 103.9,-21.0 103.9,-74.0 107.4,-76.0"
  ></polygon><polygon class="ln" points="100.5,-23.0 103.9,-21.0 103.9,-74.0 100.5,-76.0"></polygon><polygon
    class="ln"
    points="103.9,-78.0 107.4,-76.0 103.9,-74.0 100.5,-76.0"
  ></polygon><text class="tx" x="161.2" y="-39.0" text-anchor="start">3 Guided walkthrough</text><polygon
    class="ln"
    points="147.2,-95.0 102.2,-69.0 102.2,-74.0 147.2,-100.0"
  ></polygon><polygon class="ln" points="5.2,-125.0 102.2,-69.0 102.2,-74.0 5.2,-130.0"></polygon><polygon
    class="ln"
    points="50.2,-156.0 147.2,-100.0 102.2,-74.0 5.2,-130.0"
  ></polygon><g transform="matrix(0.8660 0.5000 -0.8660 0.5000 71.0 -136.0)"
    ><rect class="ko" x="6" y="2" width="30" height="30" rx="1.5"></rect><rect
      class="ko"
      x="11"
      y="8"
      width="5"
      height="5"
      rx="1"
    ></rect><line class="ko" x1="20" y1="10.5" x2="31" y2="10.5"></line><rect
      class="ko"
      x="11"
      y="17"
      width="5"
      height="5"
      rx="1"
    ></rect><line class="ko" x1="20" y1="19.5" x2="31" y2="19.5"></line><path class="ko" d="M12 10.5 L13.5 12 L15.5 9"
    ></path></g
  ><polygon class="ln" points="140.3,-100.0 136.8,-98.0 136.8,-151.0 140.3,-153.0"></polygon><polygon
    class="ln"
    points="133.4,-100.0 136.8,-98.0 136.8,-151.0 133.4,-153.0"
  ></polygon><polygon class="ln" points="136.8,-155.0 140.3,-153.0 136.8,-151.0 133.4,-153.0"></polygon><polygon
    class="ln"
    points="107.4,-81.0 103.9,-79.0 103.9,-132.0 107.4,-134.0"
  ></polygon><polygon class="ln" points="100.5,-81.0 103.9,-79.0 103.9,-132.0 100.5,-134.0"></polygon><polygon
    class="ln"
    points="103.9,-136.0 107.4,-134.0 103.9,-132.0 100.5,-134.0"
  ></polygon><text class="tk" x="161.2" y="-97.0" text-anchor="start">4 Structured training</text><polygon
    class="ln"
    points="147.2,-153.0 102.2,-127.0 102.2,-132.0 147.2,-158.0"
  ></polygon><polygon class="ln" points="5.2,-183.0 102.2,-127.0 102.2,-132.0 5.2,-188.0"></polygon><polygon
    class="ln"
    points="50.2,-214.0 147.2,-158.0 102.2,-132.0 5.2,-188.0"
  ></polygon><g transform="matrix(0.8660 0.5000 -0.8660 0.5000 71.0 -194.0)"
    ><rect class="ko" x="2" y="4" width="38" height="27" rx="1.5"></rect><line class="ko" x1="8" y1="11" x2="26" y2="11"
    ></line><line class="ko" x1="8" y1="17" x2="22" y2="17"></line><circle class="kf" cx="32" cy="23" r="4"></circle></g
  ><text class="tk" x="161.2" y="-155.0" text-anchor="start">5 Certified training</text><g opacity="0"
    ><animate
      attributeName="opacity"
      values="0;1;0"
      keyTimes="0;0.5929;0.7857"
      dur="14s"
      begin="0.000s"
      calcMode="discrete"
      repeatCount="indefinite"
    ></animate><animateTransform
      attributeName="transform"
      type="translate"
      values="0 6;0 6;0 0;0 0"
      dur="14s"
      begin="0.000s"
      keyTimes="0;0.5929;0.6357;1"
      calcMode="linear"
      repeatCount="indefinite"
    ></animateTransform><rect class="ink" x="-13.0" y="-301.0" width="26" height="18" rx="1.5"></rect><line
      class="ko"
      x1="-9.0"
      y1="-295.0"
      x2="2.0"
      y2="-295.0"
    ></line><circle class="kf" cx="7.0" cy="-288.0" r="3"></circle></g
  >
</MachineFrame>
