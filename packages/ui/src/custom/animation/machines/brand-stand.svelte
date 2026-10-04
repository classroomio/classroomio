<script lang="ts">
  import MachineFrame from './machine-frame.svelte';
  import type { MachineProps } from './types';

  let { label, stillAt, class: className }: MachineProps = $props();
</script>

<MachineFrame viewBox="-230 -154 460 333" {label} {stillAt} class={className}>
  <ellipse class="ln" cx="0.0" cy="0.0" rx="208.2" ry="120.2"></ellipse><rect
    class="fl"
    x="-208.2"
    y="-10.0"
    width="416.4"
    height="10"
  ></rect><line class="lo" x1="-208.2" y1="-10.0" x2="-208.2" y2="0.0"></line><line
    class="lo"
    x1="208.2"
    y1="-10.0"
    x2="208.2"
    y2="0.0"
  ></line><ellipse class="ln" cx="0.0" cy="-10.0" rx="208.2" ry="120.2"></ellipse><g
    transform="matrix(0.8660 0.5000 -0.8660 0.5000 0.0 -10.0)"
    ><g
      ><animateTransform
        attributeName="transform"
        type="rotate"
        values="0;360"
        dur="30s"
        begin="0.000s"
        calcMode="linear"
        repeatCount="indefinite"
      ></animateTransform><line class="lt" x1="148.0" y1="0.0" x2="162.0" y2="0.0"></line><line
        class="lt"
        x1="154.7"
        y1="20.4"
        x2="160.6"
        y2="21.1"
      ></line><line class="lt" x1="150.7" y1="40.4" x2="156.5" y2="41.9"></line><line
        class="lt"
        x1="144.1"
        y1="59.7"
        x2="149.7"
        y2="62.0"
      ></line><line class="lt" x1="128.2" y1="74.0" x2="140.3" y2="81.0"></line><line
        class="lt"
        x1="123.8"
        y1="95.0"
        x2="128.5"
        y2="98.6"
      ></line><line class="lt" x1="110.3" y1="110.3" x2="114.6" y2="114.6"></line><line
        class="lt"
        x1="95.0"
        y1="123.8"
        x2="98.6"
        y2="128.5"
      ></line><line class="lt" x1="74.0" y1="128.2" x2="81.0" y2="140.3"></line><line
        class="lt"
        x1="59.7"
        y1="144.1"
        x2="62.0"
        y2="149.7"
      ></line><line class="lt" x1="40.4" y1="150.7" x2="41.9" y2="156.5"></line><line
        class="lt"
        x1="20.4"
        y1="154.7"
        x2="21.1"
        y2="160.6"
      ></line><line class="lt" x1="0.0" y1="148.0" x2="0.0" y2="162.0"></line><line
        class="lt"
        x1="-20.4"
        y1="154.7"
        x2="-21.1"
        y2="160.6"
      ></line><line class="lt" x1="-40.4" y1="150.7" x2="-41.9" y2="156.5"></line><line
        class="lt"
        x1="-59.7"
        y1="144.1"
        x2="-62.0"
        y2="149.7"
      ></line><line class="lt" x1="-74.0" y1="128.2" x2="-81.0" y2="140.3"></line><line
        class="lt"
        x1="-95.0"
        y1="123.8"
        x2="-98.6"
        y2="128.5"
      ></line><line class="lt" x1="-110.3" y1="110.3" x2="-114.6" y2="114.6"></line><line
        class="lt"
        x1="-123.8"
        y1="95.0"
        x2="-128.5"
        y2="98.6"
      ></line><line class="lt" x1="-128.2" y1="74.0" x2="-140.3" y2="81.0"></line><line
        class="lt"
        x1="-144.1"
        y1="59.7"
        x2="-149.7"
        y2="62.0"
      ></line><line class="lt" x1="-150.7" y1="40.4" x2="-156.5" y2="41.9"></line><line
        class="lt"
        x1="-154.7"
        y1="20.4"
        x2="-160.6"
        y2="21.1"
      ></line><line class="lt" x1="-148.0" y1="0.0" x2="-162.0" y2="0.0"></line><line
        class="lt"
        x1="-154.7"
        y1="-20.4"
        x2="-160.6"
        y2="-21.1"
      ></line><line class="lt" x1="-150.7" y1="-40.4" x2="-156.5" y2="-41.9"></line><line
        class="lt"
        x1="-144.1"
        y1="-59.7"
        x2="-149.7"
        y2="-62.0"
      ></line><line class="lt" x1="-128.2" y1="-74.0" x2="-140.3" y2="-81.0"></line><line
        class="lt"
        x1="-123.8"
        y1="-95.0"
        x2="-128.5"
        y2="-98.6"
      ></line><line class="lt" x1="-110.3" y1="-110.3" x2="-114.6" y2="-114.6"></line><line
        class="lt"
        x1="-95.0"
        y1="-123.8"
        x2="-98.6"
        y2="-128.5"
      ></line><line class="lt" x1="-74.0" y1="-128.2" x2="-81.0" y2="-140.3"></line><line
        class="lt"
        x1="-59.7"
        y1="-144.1"
        x2="-62.0"
        y2="-149.7"
      ></line><line class="lt" x1="-40.4" y1="-150.7" x2="-41.9" y2="-156.5"></line><line
        class="lt"
        x1="-20.4"
        y1="-154.7"
        x2="-21.1"
        y2="-160.6"
      ></line><line class="lt" x1="-0.0" y1="-148.0" x2="-0.0" y2="-162.0"></line><line
        class="lt"
        x1="20.4"
        y1="-154.7"
        x2="21.1"
        y2="-160.6"
      ></line><line class="lt" x1="40.4" y1="-150.7" x2="41.9" y2="-156.5"></line><line
        class="lt"
        x1="59.7"
        y1="-144.1"
        x2="62.0"
        y2="-149.7"
      ></line><line class="lt" x1="74.0" y1="-128.2" x2="81.0" y2="-140.3"></line><line
        class="lt"
        x1="95.0"
        y1="-123.8"
        x2="98.6"
        y2="-128.5"
      ></line><line class="lt" x1="110.3" y1="-110.3" x2="114.6" y2="-114.6"></line><line
        class="lt"
        x1="123.8"
        y1="-95.0"
        x2="128.5"
        y2="-98.6"
      ></line><line class="lt" x1="128.2" y1="-74.0" x2="140.3" y2="-81.0"></line><line
        class="lt"
        x1="144.1"
        y1="-59.7"
        x2="149.7"
        y2="-62.0"
      ></line><line class="lt" x1="150.7" y1="-40.4" x2="156.5" y2="-41.9"></line><line
        class="lt"
        x1="154.7"
        y1="-20.4"
        x2="160.6"
        y2="-21.1"
      ></line></g
    ></g
  ><polygon class="ln" points="82.3,-2.5 13.0,37.5 13.0,-24.5 82.3,-64.5"></polygon><polygon
    class="ln"
    points="-82.3,-17.5 13.0,37.5 13.0,-24.5 -82.3,-79.5"
  ></polygon><polygon class="ln" points="-13.0,-119.5 82.3,-64.5 13.0,-24.5 -82.3,-79.5"></polygon><g
    transform="matrix(0.8660 0.5000 0.0000 1.0000 -82.3 -79.5)"
    ><rect class="lo" x="12" y="30" width="18" height="32"></rect><rect class="lt" x="42" y="14" width="22" height="16"
    ></rect><rect class="lt" x="74" y="14" width="22" height="16"></rect><rect
      class="lt"
      x="42"
      y="38"
      width="22"
      height="16"
    ></rect><rect class="lt" x="74" y="38" width="22" height="16"></rect></g
  ><g transform="matrix(0.8660 -0.5000 0.0000 1.0000 13.0 -24.5)"
    ><rect class="lo" x="5" y="10" width="71" height="34" rx="2"></rect><g
      ><animate
        attributeName="opacity"
        values="0;1;0"
        keyTimes="0;0.1667;0.5"
        dur="9.600000000000001s"
        begin="0.000s"
        calcMode="discrete"
        repeatCount="indefinite"
      ></animate><circle class="ko" cx="22" cy="27" r="8"></circle><circle class="kf" cx="22" cy="27" r="3"
      ></circle><text class="tk" x="34" y="30" style="font-size: 6.6px;">Acme</text></g
    ><g
      ><animate
        attributeName="opacity"
        values="0;1;0"
        keyTimes="0;0.5;0.8333"
        dur="9.600000000000001s"
        begin="0.000s"
        calcMode="discrete"
        repeatCount="indefinite"
      ></animate><path class="ko" d="M22 18 L31 35 L13 35 Z"></path><line class="ko" x1="17" y1="30" x2="27" y2="30"
      ></line><text class="tk" x="34" y="30" style="font-size: 6.6px;">Northwind</text></g
    ><g
      ><animate
        attributeName="opacity"
        values="1;0;1"
        keyTimes="0;0.1667;0.8333"
        dur="9.600000000000001s"
        begin="0.000s"
        calcMode="discrete"
        repeatCount="indefinite"
      ></animate><rect class="ko" x="14" y="19" width="10" height="10"></rect><rect
        class="ko"
        x="20"
        y="25"
        width="10"
        height="10"
      ></rect><text class="tk" x="34" y="30" style="font-size: 6.6px;">Kestrel</text></g
    ></g
  ><polygon class="ln" points="92.7,-64.5 13.0,-18.5 13.0,-24.5 92.7,-70.5"></polygon><polygon
    class="ln"
    points="-92.7,-79.5 13.0,-18.5 13.0,-24.5 -92.7,-85.5"
  ></polygon><polygon class="ln" points="-13.0,-131.5 92.7,-70.5 13.0,-24.5 -92.7,-85.5"></polygon><g
    transform="matrix(0.8660 0.5000 -0.8660 0.5000 0.0 -78.0)"
    ><g opacity="0"
      ><animate
        attributeName="opacity"
        values="0;1;1;0;0"
        keyTimes="0;0.08;0.3;0.48;1"
        dur="3.2s"
        begin="0.000s"
        calcMode="linear"
        repeatCount="indefinite"
      ></animate><animateTransform
        attributeName="transform"
        type="translate"
        values="0 0;0 0;80 0;80 0"
        dur="3.2s"
        begin="0.000s"
        keyTimes="0;0.3;0.48;1"
        calcMode="linear"
        repeatCount="indefinite"
      ></animateTransform><rect class="ln" x="-34" y="-8" width="68" height="16" rx="3"></rect><text
        class="tx"
        x="0"
        y="2.5"
        text-anchor="middle"
        style="font-size: 5.6px;">powered by ClassroomIO</text
      ></g
    ></g
  ><g
    ><animate
      attributeName="opacity"
      values="0;1;0"
      keyTimes="0;0.1667;0.5"
      dur="9.600000000000001s"
      begin="0.000s"
      calcMode="discrete"
      repeatCount="indefinite"
    ></animate><text class="tx" x="0.0" y="154.2" text-anchor="middle" style="font-size: 9px;">learn.acme.com</text></g
  ><g
    ><animate
      attributeName="opacity"
      values="0;1;0"
      keyTimes="0;0.5;0.8333"
      dur="9.600000000000001s"
      begin="0.000s"
      calcMode="discrete"
      repeatCount="indefinite"
    ></animate><text class="tx" x="0.0" y="154.2" text-anchor="middle" style="font-size: 9px;">learn.northwind.io</text
    ></g
  ><g
    ><animate
      attributeName="opacity"
      values="1;0;1"
      keyTimes="0;0.1667;0.8333"
      dur="9.600000000000001s"
      begin="0.000s"
      calcMode="discrete"
      repeatCount="indefinite"
    ></animate><text class="tx" x="0.0" y="154.2" text-anchor="middle" style="font-size: 9px;">learn.kestrel.co</text
    ></g
  >
</MachineFrame>
