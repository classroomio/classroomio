<script lang="ts">
  import MachineFrame from './machine-frame.svelte';
  import type { MachineProps } from './types';

  let { label, stillAt, class: className }: MachineProps = $props();
</script>

<MachineFrame viewBox="-74 -56 503 433" {label} {stillAt} class={className}>
  <polygon class="ln" points="116.0,49.0 111.7,51.5 111.7,-8.5 116.0,-11.0"></polygon><polygon
    class="ln"
    points="71.9,28.5 111.7,51.5 111.7,-8.5 71.9,-31.5"
  ></polygon><polygon class="ln" points="76.2,-34.0 116.0,-11.0 111.7,-8.5 71.9,-31.5"></polygon><g
    transform="matrix(0.8660 0.5000 0.0000 1.0000 71.9 -31.5)"
    ><rect class="lo" x="7" y="8" width="32" height="22" rx="2"></rect><path class="lo" d="M20 14 L28 19 L20 24 Z"
    ></path><text class="tx" x="23" y="50" text-anchor="middle" style="font-size: 5.6px;">LESSON</text></g
  ><polygon class="ln" points="194.0,94.0 189.7,96.5 189.7,36.5 194.0,34.0"></polygon><polygon
    class="ln"
    points="149.8,73.5 189.7,96.5 189.7,36.5 149.8,13.5"
  ></polygon><polygon class="ln" points="154.2,11.0 194.0,34.0 189.7,36.5 149.8,13.5"></polygon><g
    transform="matrix(0.8660 0.5000 0.0000 1.0000 149.8 13.5)"
    ><rect class="lo" x="8" y="8" width="5" height="5" rx="1"></rect><line
      class="lo"
      x1="17"
      y1="10.5"
      x2="36"
      y2="10.5"
    ></line><rect class="lo" x="8" y="16" width="5" height="5" rx="1"></rect><line
      class="lo"
      x1="17"
      y1="18.5"
      x2="31"
      y2="18.5"
    ></line><rect class="lo" x="8" y="24" width="5" height="5" rx="1"></rect><line
      class="lo"
      x1="17"
      y1="26.5"
      x2="26"
      y2="26.5"
    ></line><path class="lo" d="M9 10.5 L10.5 12 L12.5 9"></path><text
      class="tx"
      x="23"
      y="50"
      text-anchor="middle"
      style="font-size: 5.6px;">QUIZ</text
    ></g
  ><polygon class="ln" points="271.9,139.0 267.6,141.5 267.6,81.5 271.9,79.0"></polygon><polygon
    class="ln"
    points="227.8,118.5 267.6,141.5 267.6,81.5 227.8,58.5"
  ></polygon><polygon class="ln" points="232.1,56.0 271.9,79.0 267.6,81.5 227.8,58.5"></polygon><g
    transform="matrix(0.8660 0.5000 0.0000 1.0000 227.8 58.5)"
    ><line class="lo" x1="8" y1="9" x2="38" y2="9"></line><line class="lo" x1="8" y1="15" x2="29" y2="15"></line><line
      class="lo"
      x1="8"
      y1="21"
      x2="38"
      y2="21"
    ></line><line class="lo" x1="8" y1="27" x2="29" y2="27"></line><path
      class="lo"
      d="M28 32 L38 22 L40 24 L30 34 L27 35 Z"
    ></path><text class="tx" x="23" y="50" text-anchor="middle" style="font-size: 5.6px;">ASSIGNMENT</text></g
  ><polygon class="ln" points="325.6,172.0 318.7,176.0 318.7,88.0 325.6,84.0"></polygon><polygon
    class="ln"
    points="311.8,172.0 318.7,176.0 318.7,88.0 311.8,84.0"
  ></polygon><polygon class="ln" points="318.7,80.0 325.6,84.0 318.7,88.0 311.8,84.0"></polygon><polygon
    class="ln"
    points="407.0,235.0 355.1,265.0 355.1,257.0 407.0,227.0"
  ></polygon><polygon class="ln" points="-52.0,30.0 355.1,265.0 355.1,257.0 -52.0,22.0"></polygon><polygon
    class="ln"
    points="0.0,-8.0 407.0,227.0 355.1,257.0 -52.0,22.0"
  ></polygon><line class="lt" x1="23.4" y1="8.5" x2="-23.4" y2="35.5"></line><line
    class="lt"
    x1="49.4"
    y1="23.5"
    x2="2.6"
    y2="50.5"
  ></line><line class="lt" x1="75.3" y1="38.5" x2="28.6" y2="65.5"></line><line
    class="lt"
    x1="101.3"
    y1="53.5"
    x2="54.6"
    y2="80.5"
  ></line><line class="lt" x1="127.3" y1="68.5" x2="80.5" y2="95.5"></line><line
    class="lt"
    x1="153.3"
    y1="83.5"
    x2="106.5"
    y2="110.5"
  ></line><line class="lt" x1="179.3" y1="98.5" x2="132.5" y2="125.5"></line><line
    class="lt"
    x1="205.2"
    y1="113.5"
    x2="158.5"
    y2="140.5"
  ></line><line class="lt" x1="231.2" y1="128.5" x2="184.5" y2="155.5"></line><line
    class="lt"
    x1="257.2"
    y1="143.5"
    x2="210.4"
    y2="170.5"
  ></line><line class="lt" x1="283.2" y1="158.5" x2="236.4" y2="185.5"></line><line
    class="lt"
    x1="309.2"
    y1="173.5"
    x2="262.4"
    y2="200.5"
  ></line><line class="lt" x1="335.2" y1="188.5" x2="288.4" y2="215.5"></line><line
    class="lt"
    x1="361.1"
    y1="203.5"
    x2="314.4"
    y2="230.5"
  ></line><line class="lt" x1="387.1" y1="218.5" x2="340.3" y2="245.5"></line><polyline
    class="lo"
    points="332.6,251.0 269.3,287.5 297.0,303.5"
  ></polyline><g opacity="0"
    ><animate
      attributeName="opacity"
      values="0;1;1;0"
      keyTimes="0;0.04;0.94;1"
      dur="12s"
      begin="0.000s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animate><animateTransform
      attributeName="transform"
      type="translate"
      values="0 0;372.4 215.0"
      dur="12s"
      begin="0.000s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animateTransform><polygon class="ln" points="15.6,17.0 -8.7,31.0 -8.7,3.0 15.6,-11.0"></polygon><polygon
      class="ln"
      points="-32.9,17.0 -8.7,31.0 -8.7,3.0 -32.9,-11.0"
    ></polygon><polygon class="ln" points="-8.7,-25.0 15.6,-11.0 -8.7,3.0 -32.9,-11.0"></polygon><circle
      class="dot"
      cx="-8.7"
      cy="-14.6"
      r=".8"
    ></circle><circle class="dot" cx="-11.8" cy="-12.8" r=".8"></circle><circle class="dot" cx="-15.0" cy="-11.0" r=".8"
    ></circle><circle class="dot" cx="-5.5" cy="-12.8" r=".8"></circle><circle class="dot" cx="-8.7" cy="-11.0" r=".8"
    ></circle><circle class="dot" cx="-11.8" cy="-9.2" r=".8"></circle><circle class="dot" cx="-2.4" cy="-11.0" r=".8"
    ></circle><circle class="dot" cx="-5.5" cy="-9.2" r=".8"></circle><circle class="dot" cx="-8.7" cy="-7.4" r=".8"
    ></circle><g transform="matrix(0.8660 0.5000 0.0000 1.0000 -32.9 -11.0)"
      ><g opacity="0"
        ><animate
          attributeName="opacity"
          values="0;1"
          keyTimes="0;0.1698"
          dur="12s"
          begin="0.000s"
          calcMode="discrete"
          repeatCount="indefinite"
        ></animate><line class="bar" x1="5" y1="20" x2="9" y2="20"></line></g
      ><g opacity="0"
        ><animate
          attributeName="opacity"
          values="0;1"
          keyTimes="0;0.3791"
          dur="12s"
          begin="0.000s"
          calcMode="discrete"
          repeatCount="indefinite"
        ></animate><line class="bar" x1="12" y1="20" x2="16" y2="20"></line></g
      ><g opacity="0"
        ><animate
          attributeName="opacity"
          values="0;1"
          keyTimes="0;0.5884"
          dur="12s"
          begin="0.000s"
          calcMode="discrete"
          repeatCount="indefinite"
        ></animate><line class="bar" x1="19" y1="20" x2="23" y2="20"></line></g
      ></g
    ><g opacity="0"
      ><animate
        attributeName="opacity"
        values="0;1"
        keyTimes="0;0.7854"
        dur="12s"
        begin="0.000s"
        calcMode="discrete"
        repeatCount="indefinite"
      ></animate><g transform="matrix(0.8660 0.5000 -0.8660 0.5000 -8.7 -25.0)"
        ><rect class="ink" x="6" y="7" width="16" height="13" rx="1"></rect><line
          class="ko"
          x1="9"
          y1="11"
          x2="17"
          y2="11"
        ></line><circle class="kf" cx="18" cy="16.5" r="2.4"></circle></g
      ></g
    ></g
  ><g opacity="0"
    ><animate
      attributeName="opacity"
      values="0;1;1;0"
      keyTimes="0;0.04;0.94;1"
      dur="12s"
      begin="-2.400s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animate><animateTransform
      attributeName="transform"
      type="translate"
      values="0 0;372.4 215.0"
      dur="12s"
      begin="-2.400s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animateTransform><polygon class="ln" points="15.6,17.0 -8.7,31.0 -8.7,3.0 15.6,-11.0"></polygon><polygon
      class="ln"
      points="-32.9,17.0 -8.7,31.0 -8.7,3.0 -32.9,-11.0"
    ></polygon><polygon class="ln" points="-8.7,-25.0 15.6,-11.0 -8.7,3.0 -32.9,-11.0"></polygon><circle
      class="dot"
      cx="-8.7"
      cy="-14.6"
      r=".8"
    ></circle><circle class="dot" cx="-11.8" cy="-12.8" r=".8"></circle><circle class="dot" cx="-15.0" cy="-11.0" r=".8"
    ></circle><circle class="dot" cx="-5.5" cy="-12.8" r=".8"></circle><circle class="dot" cx="-8.7" cy="-11.0" r=".8"
    ></circle><circle class="dot" cx="-11.8" cy="-9.2" r=".8"></circle><circle class="dot" cx="-2.4" cy="-11.0" r=".8"
    ></circle><circle class="dot" cx="-5.5" cy="-9.2" r=".8"></circle><circle class="dot" cx="-8.7" cy="-7.4" r=".8"
    ></circle><g transform="matrix(0.8660 0.5000 0.0000 1.0000 -32.9 -11.0)"
      ><g opacity="0"
        ><animate
          attributeName="opacity"
          values="0;1"
          keyTimes="0;0.1698"
          dur="12s"
          begin="-2.400s"
          calcMode="discrete"
          repeatCount="indefinite"
        ></animate><line class="bar" x1="5" y1="20" x2="9" y2="20"></line></g
      ><g opacity="0"
        ><animate
          attributeName="opacity"
          values="0;1"
          keyTimes="0;0.3791"
          dur="12s"
          begin="-2.400s"
          calcMode="discrete"
          repeatCount="indefinite"
        ></animate><line class="bar" x1="12" y1="20" x2="16" y2="20"></line></g
      ><g opacity="0"
        ><animate
          attributeName="opacity"
          values="0;1"
          keyTimes="0;0.5884"
          dur="12s"
          begin="-2.400s"
          calcMode="discrete"
          repeatCount="indefinite"
        ></animate><line class="bar" x1="19" y1="20" x2="23" y2="20"></line></g
      ></g
    ><g opacity="0"
      ><animate
        attributeName="opacity"
        values="0;1"
        keyTimes="0;0.7854"
        dur="12s"
        begin="-2.400s"
        calcMode="discrete"
        repeatCount="indefinite"
      ></animate><g transform="matrix(0.8660 0.5000 -0.8660 0.5000 -8.7 -25.0)"
        ><rect class="ink" x="6" y="7" width="16" height="13" rx="1"></rect><line
          class="ko"
          x1="9"
          y1="11"
          x2="17"
          y2="11"
        ></line><circle class="kf" cx="18" cy="16.5" r="2.4"></circle></g
      ></g
    ></g
  ><g opacity="0"
    ><animate
      attributeName="opacity"
      values="0;1;1;0"
      keyTimes="0;0.04;0.94;1"
      dur="12s"
      begin="-4.800s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animate><animateTransform
      attributeName="transform"
      type="translate"
      values="0 0;372.4 215.0"
      dur="12s"
      begin="-4.800s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animateTransform><polygon class="ln" points="15.6,17.0 -8.7,31.0 -8.7,3.0 15.6,-11.0"></polygon><polygon
      class="ln"
      points="-32.9,17.0 -8.7,31.0 -8.7,3.0 -32.9,-11.0"
    ></polygon><polygon class="ln" points="-8.7,-25.0 15.6,-11.0 -8.7,3.0 -32.9,-11.0"></polygon><circle
      class="dot"
      cx="-8.7"
      cy="-14.6"
      r=".8"
    ></circle><circle class="dot" cx="-11.8" cy="-12.8" r=".8"></circle><circle class="dot" cx="-15.0" cy="-11.0" r=".8"
    ></circle><circle class="dot" cx="-5.5" cy="-12.8" r=".8"></circle><circle class="dot" cx="-8.7" cy="-11.0" r=".8"
    ></circle><circle class="dot" cx="-11.8" cy="-9.2" r=".8"></circle><circle class="dot" cx="-2.4" cy="-11.0" r=".8"
    ></circle><circle class="dot" cx="-5.5" cy="-9.2" r=".8"></circle><circle class="dot" cx="-8.7" cy="-7.4" r=".8"
    ></circle><g transform="matrix(0.8660 0.5000 0.0000 1.0000 -32.9 -11.0)"
      ><g opacity="0"
        ><animate
          attributeName="opacity"
          values="0;1"
          keyTimes="0;0.1698"
          dur="12s"
          begin="-4.800s"
          calcMode="discrete"
          repeatCount="indefinite"
        ></animate><line class="bar" x1="5" y1="20" x2="9" y2="20"></line></g
      ><g opacity="0"
        ><animate
          attributeName="opacity"
          values="0;1"
          keyTimes="0;0.3791"
          dur="12s"
          begin="-4.800s"
          calcMode="discrete"
          repeatCount="indefinite"
        ></animate><line class="bar" x1="12" y1="20" x2="16" y2="20"></line></g
      ><g opacity="0"
        ><animate
          attributeName="opacity"
          values="0;1"
          keyTimes="0;0.5884"
          dur="12s"
          begin="-4.800s"
          calcMode="discrete"
          repeatCount="indefinite"
        ></animate><line class="bar" x1="19" y1="20" x2="23" y2="20"></line></g
      ></g
    ><g opacity="0"
      ><animate
        attributeName="opacity"
        values="0;1"
        keyTimes="0;0.7854"
        dur="12s"
        begin="-4.800s"
        calcMode="discrete"
        repeatCount="indefinite"
      ></animate><g transform="matrix(0.8660 0.5000 -0.8660 0.5000 -8.7 -25.0)"
        ><rect class="ink" x="6" y="7" width="16" height="13" rx="1"></rect><line
          class="ko"
          x1="9"
          y1="11"
          x2="17"
          y2="11"
        ></line><circle class="kf" cx="18" cy="16.5" r="2.4"></circle></g
      ></g
    ></g
  ><g opacity="0"
    ><animate
      attributeName="opacity"
      values="0;1;1;0"
      keyTimes="0;0.04;0.94;1"
      dur="12s"
      begin="-7.200s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animate><animateTransform
      attributeName="transform"
      type="translate"
      values="0 0;372.4 215.0"
      dur="12s"
      begin="-7.200s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animateTransform><polygon class="ln" points="15.6,17.0 -8.7,31.0 -8.7,3.0 15.6,-11.0"></polygon><polygon
      class="ln"
      points="-32.9,17.0 -8.7,31.0 -8.7,3.0 -32.9,-11.0"
    ></polygon><polygon class="ln" points="-8.7,-25.0 15.6,-11.0 -8.7,3.0 -32.9,-11.0"></polygon><circle
      class="dot"
      cx="-8.7"
      cy="-14.6"
      r=".8"
    ></circle><circle class="dot" cx="-11.8" cy="-12.8" r=".8"></circle><circle class="dot" cx="-15.0" cy="-11.0" r=".8"
    ></circle><circle class="dot" cx="-5.5" cy="-12.8" r=".8"></circle><circle class="dot" cx="-8.7" cy="-11.0" r=".8"
    ></circle><circle class="dot" cx="-11.8" cy="-9.2" r=".8"></circle><circle class="dot" cx="-2.4" cy="-11.0" r=".8"
    ></circle><circle class="dot" cx="-5.5" cy="-9.2" r=".8"></circle><circle class="dot" cx="-8.7" cy="-7.4" r=".8"
    ></circle><g transform="matrix(0.8660 0.5000 0.0000 1.0000 -32.9 -11.0)"
      ><g opacity="0"
        ><animate
          attributeName="opacity"
          values="0;1"
          keyTimes="0;0.1698"
          dur="12s"
          begin="-7.200s"
          calcMode="discrete"
          repeatCount="indefinite"
        ></animate><line class="bar" x1="5" y1="20" x2="9" y2="20"></line></g
      ><g opacity="0"
        ><animate
          attributeName="opacity"
          values="0;1"
          keyTimes="0;0.3791"
          dur="12s"
          begin="-7.200s"
          calcMode="discrete"
          repeatCount="indefinite"
        ></animate><line class="bar" x1="12" y1="20" x2="16" y2="20"></line></g
      ><g opacity="0"
        ><animate
          attributeName="opacity"
          values="0;1"
          keyTimes="0;0.5884"
          dur="12s"
          begin="-7.200s"
          calcMode="discrete"
          repeatCount="indefinite"
        ></animate><line class="bar" x1="19" y1="20" x2="23" y2="20"></line></g
      ></g
    ><g opacity="0"
      ><animate
        attributeName="opacity"
        values="0;1"
        keyTimes="0;0.7854"
        dur="12s"
        begin="-7.200s"
        calcMode="discrete"
        repeatCount="indefinite"
      ></animate><g transform="matrix(0.8660 0.5000 -0.8660 0.5000 -8.7 -25.0)"
        ><rect class="ink" x="6" y="7" width="16" height="13" rx="1"></rect><line
          class="ko"
          x1="9"
          y1="11"
          x2="17"
          y2="11"
        ></line><circle class="kf" cx="18" cy="16.5" r="2.4"></circle></g
      ></g
    ></g
  ><g opacity="0"
    ><animate
      attributeName="opacity"
      values="0;1;1;0"
      keyTimes="0;0.04;0.94;1"
      dur="12s"
      begin="-9.600s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animate><animateTransform
      attributeName="transform"
      type="translate"
      values="0 0;372.4 215.0"
      dur="12s"
      begin="-9.600s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animateTransform><polygon class="ln" points="15.6,17.0 -8.7,31.0 -8.7,3.0 15.6,-11.0"></polygon><polygon
      class="ln"
      points="-32.9,17.0 -8.7,31.0 -8.7,3.0 -32.9,-11.0"
    ></polygon><polygon class="ln" points="-8.7,-25.0 15.6,-11.0 -8.7,3.0 -32.9,-11.0"></polygon><circle
      class="dot"
      cx="-8.7"
      cy="-14.6"
      r=".8"
    ></circle><circle class="dot" cx="-11.8" cy="-12.8" r=".8"></circle><circle class="dot" cx="-15.0" cy="-11.0" r=".8"
    ></circle><circle class="dot" cx="-5.5" cy="-12.8" r=".8"></circle><circle class="dot" cx="-8.7" cy="-11.0" r=".8"
    ></circle><circle class="dot" cx="-11.8" cy="-9.2" r=".8"></circle><circle class="dot" cx="-2.4" cy="-11.0" r=".8"
    ></circle><circle class="dot" cx="-5.5" cy="-9.2" r=".8"></circle><circle class="dot" cx="-8.7" cy="-7.4" r=".8"
    ></circle><g transform="matrix(0.8660 0.5000 0.0000 1.0000 -32.9 -11.0)"
      ><g opacity="0"
        ><animate
          attributeName="opacity"
          values="0;1"
          keyTimes="0;0.1698"
          dur="12s"
          begin="-9.600s"
          calcMode="discrete"
          repeatCount="indefinite"
        ></animate><line class="bar" x1="5" y1="20" x2="9" y2="20"></line></g
      ><g opacity="0"
        ><animate
          attributeName="opacity"
          values="0;1"
          keyTimes="0;0.3791"
          dur="12s"
          begin="-9.600s"
          calcMode="discrete"
          repeatCount="indefinite"
        ></animate><line class="bar" x1="12" y1="20" x2="16" y2="20"></line></g
      ><g opacity="0"
        ><animate
          attributeName="opacity"
          values="0;1"
          keyTimes="0;0.5884"
          dur="12s"
          begin="-9.600s"
          calcMode="discrete"
          repeatCount="indefinite"
        ></animate><line class="bar" x1="19" y1="20" x2="23" y2="20"></line></g
      ></g
    ><g opacity="0"
      ><animate
        attributeName="opacity"
        values="0;1"
        keyTimes="0;0.7854"
        dur="12s"
        begin="-9.600s"
        calcMode="discrete"
        repeatCount="indefinite"
      ></animate><g transform="matrix(0.8660 0.5000 -0.8660 0.5000 -8.7 -25.0)"
        ><rect class="ink" x="6" y="7" width="16" height="13" rx="1"></rect><line
          class="ko"
          x1="9"
          y1="11"
          x2="17"
          y2="11"
        ></line><circle class="kf" cx="18" cy="16.5" r="2.4"></circle></g
      ></g
    ></g
  ><polygon class="ln" points="252.9,214.0 246.0,218.0 246.0,130.0 252.9,126.0"></polygon><polygon
    class="ln"
    points="239.0,214.0 246.0,218.0 246.0,130.0 239.0,126.0"
  ></polygon><polygon class="ln" points="246.0,122.0 252.9,126.0 246.0,130.0 239.0,126.0"></polygon><g
    ><animateTransform
      attributeName="transform"
      type="translate"
      values="0 0;0 0;0 12;0 0;0 0"
      dur="2.4s"
      begin="-1.423s"
      keyTimes="0;0.4;0.5;0.62;1"
      calcMode="linear"
      repeatCount="indefinite"
    ></animateTransform><line class="lo" x1="282.3" y1="127.0" x2="282.3" y2="109.0"></line><polygon
      class="ink"
      points="301.4,138.0 280.6,150.0 280.6,138.0 301.4,126.0"
    ></polygon><polygon class="ink" points="263.3,140.0 280.6,150.0 280.6,138.0 263.3,128.0"></polygon><polygon
      class="ink"
      points="284.1,116.0 301.4,126.0 280.6,138.0 263.3,128.0"
    ></polygon></g
  ><polygon class="ln" points="287.5,121.0 282.3,124.0 282.3,108.0 287.5,105.0"></polygon><polygon
    class="ln"
    points="277.1,121.0 282.3,124.0 282.3,108.0 277.1,105.0"
  ></polygon><polygon class="ln" points="282.3,102.0 287.5,105.0 282.3,108.0 277.1,105.0"></polygon><polygon
    class="ln"
    points="325.6,84.0 246.0,130.0 246.0,122.0 325.6,76.0"
  ></polygon><polygon class="ln" points="239.0,126.0 246.0,130.0 246.0,122.0 239.0,118.0"></polygon><polygon
    class="ln"
    points="318.7,72.0 325.6,76.0 246.0,122.0 239.0,118.0"
  ></polygon><circle class="kf" r="3.2" opacity="0"
    ><animate
      attributeName="opacity"
      values="1;0"
      keyTimes="0;0.4"
      dur="2.4s"
      begin="-0.840s"
      calcMode="discrete"
      repeatCount="indefinite"
    ></animate><animateMotion
      path="M332.6 251.0 L269.3 287.5 L297.0 303.5"
      dur="2.4s"
      begin="-0.840s"
      repeatCount="indefinite"
      keyPoints="0;1;1"
      keyTimes="0;0.4;1"
      calcMode="linear"
    ></animateMotion></circle
  ><polygon class="ln" points="384.5,326.0 334.3,355.0 334.3,313.0 384.5,284.0"></polygon><polygon
    class="ln"
    points="271.9,319.0 334.3,355.0 334.3,313.0 271.9,277.0"
  ></polygon><polygon class="ln" points="322.2,248.0 384.5,284.0 334.3,313.0 271.9,277.0"></polygon><g
    transform="matrix(0.8660 0.5000 -0.8660 0.5000 322.2 248.0)"
    ><circle class="lo" cx="12" cy="13" r="4"></circle><line class="lt" x1="22" y1="13" x2="50" y2="13"></line><circle
      class="lo"
      cx="12"
      cy="29"
      r="4"
    ></circle><line class="lt" x1="22" y1="29" x2="44" y2="29"></line><circle class="lo" cx="12" cy="45" r="4"
    ></circle><line class="lt" x1="22" y1="45" x2="38" y2="45"></line><g opacity="0"
      ><animate
        attributeName="opacity"
        values="0;0;1;1;0"
        keyTimes="0;0.36;0.4;0.85;1"
        dur="2.4s"
        begin="-0.840s"
        calcMode="linear"
        repeatCount="indefinite"
      ></animate><path class="ko" d="M54 28 L57 31 L63 25"></path></g
    ></g
  ><g transform="matrix(0.8660 0.5000 0.0000 1.0000 271.9 277.0)"
    ><text class="tx" x="8" y="18" style="font-size: 7px;">CRM</text></g
  ><g opacity="0"
    ><animate
      attributeName="opacity"
      values="0;0;1;0;0"
      keyTimes="0;0.38;0.41;0.7;1"
      dur="2.4s"
      begin="-0.840s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animate><polygon class="ko" points="322.2,248.0 384.5,284.0 334.3,313.0 271.9,277.0"></polygon></g
  >
</MachineFrame>
