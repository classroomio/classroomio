<script lang="ts">
  import MachineFrame from './machine-frame.svelte';
  import type { MachineProps } from './types';

  let { label, stillAt, class: className }: MachineProps = $props();
</script>

<MachineFrame viewBox="-77 -57 468 321" {label} {stillAt} class={className}>
  <polygon class="ln" points="368.9,173.0 358.5,179.0 358.5,173.0 368.9,167.0"></polygon><polygon
    class="ln"
    points="329.1,162.0 358.5,179.0 358.5,173.0 329.1,156.0"
  ></polygon><polygon class="ln" points="339.5,150.0 368.9,167.0 358.5,173.0 329.1,156.0"></polygon><polygon
    class="ln"
    points="352.5,161.5 349.0,163.5 349.0,153.5 352.5,151.5"
  ></polygon><polygon class="ln" points="345.5,161.5 349.0,163.5 349.0,153.5 345.5,151.5"></polygon><polygon
    class="ln"
    points="349.0,149.5 352.5,151.5 349.0,153.5 345.5,151.5"
  ></polygon><g transform="matrix(0.8660 0.5000 0.0000 1.0000 328.2 97.5)"
    ><circle class="ln" cx="22" cy="22" r="20"></circle><line class="lt" x1="37.0" y1="22.0" x2="40.0" y2="22.0"
    ></line><line class="lt" x1="35.0" y1="29.5" x2="37.6" y2="31.0"></line><line
      class="lt"
      x1="29.5"
      y1="35.0"
      x2="31.0"
      y2="37.6"
    ></line><line class="lt" x1="22.0" y1="37.0" x2="22.0" y2="40.0"></line><line
      class="lt"
      x1="14.5"
      y1="35.0"
      x2="13.0"
      y2="37.6"
    ></line><line class="lt" x1="9.0" y1="29.5" x2="6.4" y2="31.0"></line><line
      class="lt"
      x1="7.0"
      y1="22.0"
      x2="4.0"
      y2="22.0"
    ></line><line class="lt" x1="9.0" y1="14.5" x2="6.4" y2="13.0"></line><line
      class="lt"
      x1="14.5"
      y1="9.0"
      x2="13.0"
      y2="6.4"
    ></line><line class="lt" x1="22.0" y1="7.0" x2="22.0" y2="4.0"></line><line
      class="lt"
      x1="29.5"
      y1="9.0"
      x2="31.0"
      y2="6.4"
    ></line><line class="lt" x1="35.0" y1="14.5" x2="37.6" y2="13.0"></line><g
      ><animateTransform
        attributeName="transform"
        type="rotate"
        values="0 22 22;360 22 22"
        dur="22s"
        begin="0.000s"
        calcMode="linear"
        repeatCount="indefinite"
      ></animateTransform><line class="ko" x1="22" y1="22" x2="22" y2="8"></line></g
    ><circle class="kf" cx="22" cy="22" r="1.6"></circle><text
      class="tx"
      x="22"
      y="-6"
      text-anchor="middle"
      style="font-size: 6px;">EXPIRES 10/2027</text
    ></g
  ><polygon class="ln" points="126.4,61.0 119.5,65.0 119.5,-19.0 126.4,-23.0"></polygon><polygon
    class="ln"
    points="112.6,61.0 119.5,65.0 119.5,-19.0 112.6,-23.0"
  ></polygon><polygon class="ln" points="119.5,-27.0 126.4,-23.0 119.5,-19.0 112.6,-23.0"></polygon><polygon
    class="ln"
    points="240.8,123.0 235.6,126.0 235.6,52.0 240.8,49.0"
  ></polygon><polygon class="ln" points="230.4,123.0 235.6,126.0 235.6,52.0 230.4,49.0"></polygon><polygon
    class="ln"
    points="235.6,46.0 240.8,49.0 235.6,52.0 230.4,49.0"
  ></polygon><polygon class="ln" points="363.7,210.0 308.3,242.0 308.3,234.0 363.7,202.0"></polygon><polygon
    class="ln"
    points="-55.4,32.0 308.3,242.0 308.3,234.0 -55.4,24.0"
  ></polygon><polygon class="ln" points="0.0,-8.0 363.7,202.0 308.3,234.0 -55.4,24.0"></polygon><line
    class="lt"
    x1="23.4"
    y1="8.5"
    x2="-26.8"
    y2="37.5"
  ></line><line class="lt" x1="49.4" y1="23.5" x2="-0.9" y2="52.5"></line><line
    class="lt"
    x1="75.3"
    y1="38.5"
    x2="25.1"
    y2="67.5"
  ></line><line class="lt" x1="101.3" y1="53.5" x2="51.1" y2="82.5"></line><line
    class="lt"
    x1="127.3"
    y1="68.5"
    x2="77.1"
    y2="97.5"
  ></line><line class="lt" x1="153.3" y1="83.5" x2="103.1" y2="112.5"></line><line
    class="lt"
    x1="179.3"
    y1="98.5"
    x2="129.0"
    y2="127.5"
  ></line><line class="lt" x1="205.2" y1="113.5" x2="155.0" y2="142.5"></line><line
    class="lt"
    x1="231.2"
    y1="128.5"
    x2="181.0"
    y2="157.5"
  ></line><line class="lt" x1="257.2" y1="143.5" x2="207.0" y2="172.5"></line><line
    class="lt"
    x1="283.2"
    y1="158.5"
    x2="233.0"
    y2="187.5"
  ></line><line class="lt" x1="309.2" y1="173.5" x2="258.9" y2="202.5"></line><line
    class="lt"
    x1="335.2"
    y1="188.5"
    x2="284.9"
    y2="217.5"
  ></line><g opacity="0"
    ><animate
      attributeName="opacity"
      values="0;1;1;0"
      keyTimes="0;0.04;0.94;1"
      dur="11s"
      begin="0.000s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animate><animateTransform
      attributeName="transform"
      type="translate"
      values="0 0;313.5 181.0"
      dur="11s"
      begin="0.000s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animateTransform><polygon class="ln" points="32.9,25.0 1.7,43.0 1.7,40.0 32.9,22.0"></polygon><polygon
      class="ln"
      points="-38.1,20.0 1.7,43.0 1.7,40.0 -38.1,17.0"
    ></polygon><polygon class="ln" points="-6.9,-1.0 32.9,22.0 1.7,40.0 -38.1,17.0"></polygon><g
      transform="matrix(0.8660 0.5000 -0.8660 0.5000 -6.9 -1.0)"
      ><line class="lo" x1="6" y1="8" x2="28" y2="8"></line><line class="lt" x1="6" y1="15" x2="36" y2="15"></line><line
        class="lt"
        x1="6"
        y1="21"
        x2="24"
        y2="21"
      ></line><g opacity="0"
        ><animate
          attributeName="opacity"
          values="0;1"
          keyTimes="0;0.2471"
          dur="11s"
          begin="0.000s"
          calcMode="discrete"
          repeatCount="indefinite"
        ></animate><circle class="kf" cx="36" cy="26" r="4.5"></circle><path class="ko" d="M33 29 L31 34 M39 29 L41 34"
        ></path></g
      ></g
    ><g opacity="0"
      ><animate
        attributeName="opacity"
        values="0;1"
        keyTimes="0;0.6536"
        dur="11s"
        begin="0.000s"
        calcMode="discrete"
        repeatCount="indefinite"
      ></animate><path class="ko" d="M-7.6 -2.5 L-3.6 1.5 L4.4 -7.5"></path></g
    ></g
  ><g opacity="0"
    ><animate
      attributeName="opacity"
      values="0;1;1;0"
      keyTimes="0;0.04;0.94;1"
      dur="11s"
      begin="-2.750s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animate><animateTransform
      attributeName="transform"
      type="translate"
      values="0 0;313.5 181.0"
      dur="11s"
      begin="-2.750s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animateTransform><polygon class="ln" points="32.9,25.0 1.7,43.0 1.7,40.0 32.9,22.0"></polygon><polygon
      class="ln"
      points="-38.1,20.0 1.7,43.0 1.7,40.0 -38.1,17.0"
    ></polygon><polygon class="ln" points="-6.9,-1.0 32.9,22.0 1.7,40.0 -38.1,17.0"></polygon><g
      transform="matrix(0.8660 0.5000 -0.8660 0.5000 -6.9 -1.0)"
      ><line class="lo" x1="6" y1="8" x2="28" y2="8"></line><line class="lt" x1="6" y1="15" x2="36" y2="15"></line><line
        class="lt"
        x1="6"
        y1="21"
        x2="24"
        y2="21"
      ></line><g opacity="0"
        ><animate
          attributeName="opacity"
          values="0;1"
          keyTimes="0;0.2471"
          dur="11s"
          begin="-2.750s"
          calcMode="discrete"
          repeatCount="indefinite"
        ></animate><circle class="kf" cx="36" cy="26" r="4.5"></circle><path class="ko" d="M33 29 L31 34 M39 29 L41 34"
        ></path></g
      ></g
    ><g opacity="0"
      ><animate
        attributeName="opacity"
        values="0;1"
        keyTimes="0;0.6536"
        dur="11s"
        begin="-2.750s"
        calcMode="discrete"
        repeatCount="indefinite"
      ></animate><path class="ko" d="M-7.6 -2.5 L-3.6 1.5 L4.4 -7.5"></path></g
    ></g
  ><g opacity="0"
    ><animate
      attributeName="opacity"
      values="0;1;1;0"
      keyTimes="0;0.04;0.94;1"
      dur="11s"
      begin="-5.500s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animate><animateTransform
      attributeName="transform"
      type="translate"
      values="0 0;313.5 181.0"
      dur="11s"
      begin="-5.500s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animateTransform><polygon class="ln" points="32.9,25.0 1.7,43.0 1.7,40.0 32.9,22.0"></polygon><polygon
      class="ln"
      points="-38.1,20.0 1.7,43.0 1.7,40.0 -38.1,17.0"
    ></polygon><polygon class="ln" points="-6.9,-1.0 32.9,22.0 1.7,40.0 -38.1,17.0"></polygon><g
      transform="matrix(0.8660 0.5000 -0.8660 0.5000 -6.9 -1.0)"
      ><line class="lo" x1="6" y1="8" x2="28" y2="8"></line><line class="lt" x1="6" y1="15" x2="36" y2="15"></line><line
        class="lt"
        x1="6"
        y1="21"
        x2="24"
        y2="21"
      ></line><g opacity="0"
        ><animate
          attributeName="opacity"
          values="0;1"
          keyTimes="0;0.2471"
          dur="11s"
          begin="-5.500s"
          calcMode="discrete"
          repeatCount="indefinite"
        ></animate><circle class="kf" cx="36" cy="26" r="4.5"></circle><path class="ko" d="M33 29 L31 34 M39 29 L41 34"
        ></path></g
      ></g
    ><g opacity="0"
      ><animate
        attributeName="opacity"
        values="0;1"
        keyTimes="0;0.6536"
        dur="11s"
        begin="-5.500s"
        calcMode="discrete"
        repeatCount="indefinite"
      ></animate><path class="ko" d="M-7.6 -2.5 L-3.6 1.5 L4.4 -7.5"></path></g
    ></g
  ><g opacity="0"
    ><animate
      attributeName="opacity"
      values="0;1;1;0"
      keyTimes="0;0.04;0.94;1"
      dur="11s"
      begin="-8.250s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animate><animateTransform
      attributeName="transform"
      type="translate"
      values="0 0;313.5 181.0"
      dur="11s"
      begin="-8.250s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animateTransform><polygon class="ln" points="32.9,25.0 1.7,43.0 1.7,40.0 32.9,22.0"></polygon><polygon
      class="ln"
      points="-38.1,20.0 1.7,43.0 1.7,40.0 -38.1,17.0"
    ></polygon><polygon class="ln" points="-6.9,-1.0 32.9,22.0 1.7,40.0 -38.1,17.0"></polygon><g
      transform="matrix(0.8660 0.5000 -0.8660 0.5000 -6.9 -1.0)"
      ><line class="lo" x1="6" y1="8" x2="28" y2="8"></line><line class="lt" x1="6" y1="15" x2="36" y2="15"></line><line
        class="lt"
        x1="6"
        y1="21"
        x2="24"
        y2="21"
      ></line><g opacity="0"
        ><animate
          attributeName="opacity"
          values="0;1"
          keyTimes="0;0.2471"
          dur="11s"
          begin="-8.250s"
          calcMode="discrete"
          repeatCount="indefinite"
        ></animate><circle class="kf" cx="36" cy="26" r="4.5"></circle><path class="ko" d="M33 29 L31 34 M39 29 L41 34"
        ></path></g
      ></g
    ><g opacity="0"
      ><animate
        attributeName="opacity"
        values="0;1"
        keyTimes="0;0.6536"
        dur="11s"
        begin="-8.250s"
        calcMode="discrete"
        repeatCount="indefinite"
      ></animate><path class="ko" d="M-7.6 -2.5 L-3.6 1.5 L4.4 -7.5"></path></g
    ></g
  ><polygon class="ln" points="55.4,102.0 48.5,106.0 48.5,22.0 55.4,18.0"></polygon><polygon
    class="ln"
    points="41.6,102.0 48.5,106.0 48.5,22.0 41.6,18.0"
  ></polygon><polygon class="ln" points="48.5,14.0 55.4,18.0 48.5,22.0 41.6,18.0"></polygon><g
    ><animateTransform
      attributeName="transform"
      type="translate"
      values="0 0;0 0;0 30;0 0;0 0"
      dur="2.75s"
      begin="-1.451s"
      keyTimes="0;0.4;0.5;0.62;1"
      calcMode="linear"
      repeatCount="indefinite"
    ></animateTransform><line class="lo" x1="84.9" y1="23.0" x2="84.9" y2="5.0"></line><polygon
      class="ink"
      points="105.7,37.0 84.9,49.0 84.9,35.0 105.7,23.0"
    ></polygon><polygon class="ink" points="64.1,37.0 84.9,49.0 84.9,35.0 64.1,23.0"></polygon><polygon
      class="ink"
      points="84.9,11.0 105.7,23.0 84.9,35.0 64.1,23.0"
    ></polygon></g
  ><polygon class="ln" points="90.1,15.0 84.9,18.0 84.9,0.0 90.1,-3.0"></polygon><polygon
    class="ln"
    points="79.7,15.0 84.9,18.0 84.9,0.0 79.7,-3.0"
  ></polygon><polygon class="ln" points="84.9,-6.0 90.1,-3.0 84.9,0.0 79.7,-3.0"></polygon><polygon
    class="ln"
    points="126.4,-23.0 48.5,22.0 48.5,14.0 126.4,-31.0"
  ></polygon><polygon class="ln" points="41.6,18.0 48.5,22.0 48.5,14.0 41.6,10.0"></polygon><polygon
    class="ln"
    points="119.5,-35.0 126.4,-31.0 48.5,14.0 41.6,10.0"
  ></polygon><line class="lo" x1="235.6" y1="49.0" x2="214.8" y2="76.0"></line><ellipse
    class="ko"
    cx="199.2"
    cy="85.0"
    rx="23.3"
    ry="13.4"
  ></ellipse><ellipse class="lt" cx="199.2" cy="85.0" rx="18.4" ry="10.6"></ellipse><line
    class="lt dash"
    x1="171.5"
    y1="163.0"
    x2="154.2"
    y2="173.0"
  ></line><text class="tx" x="185.5" y="183.0" text-anchor="end" style="font-size: 7.5px;"
    >yourco.com/verify/C-2741</text
  >
</MachineFrame>
