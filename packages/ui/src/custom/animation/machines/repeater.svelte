<script lang="ts">
  import MachineFrame from './machine-frame.svelte';
  import type { MachineProps } from './types';

  let { label, stillAt, class: className }: MachineProps = $props();
</script>

<MachineFrame viewBox="-224 -170 448 309" {label} {stillAt} class={className}>
  <ellipse class="ln" cx="0.0" cy="0.0" rx="202.1" ry="116.7"></ellipse><rect
    class="fl"
    x="-202.1"
    y="-10.0"
    width="404.2"
    height="10"
  ></rect><line class="lo" x1="-202.1" y1="-10.0" x2="-202.1" y2="0.0"></line><line
    class="lo"
    x1="202.1"
    y1="-10.0"
    x2="202.1"
    y2="0.0"
  ></line><ellipse class="ln" cx="0.0" cy="-10.0" rx="202.1" ry="116.7"></ellipse><g
    transform="matrix(0.8660 0.5000 -0.8660 0.5000 0.0 -10.0)"
    ><g
      ><animateTransform
        attributeName="transform"
        type="rotate"
        values="0;360"
        dur="18s"
        begin="0.000s"
        calcMode="linear"
        repeatCount="indefinite"
      ></animateTransform><line class="lt" x1="142.0" y1="0.0" x2="157.0" y2="0.0"></line><line
        class="lt"
        x1="147.7"
        y1="26.0"
        x2="154.6"
        y2="27.3"
      ></line><line class="lt" x1="141.0" y1="51.3" x2="147.5" y2="53.7"></line><line
        class="lt"
        x1="123.0"
        y1="71.0"
        x2="136.0"
        y2="78.5"
      ></line><line class="lt" x1="114.9" y1="96.4" x2="120.3" y2="100.9"></line><line
        class="lt"
        x1="96.4"
        y1="114.9"
        x2="100.9"
        y2="120.3"
      ></line><line class="lt" x1="71.0" y1="123.0" x2="78.5" y2="136.0"></line><line
        class="lt"
        x1="51.3"
        y1="141.0"
        x2="53.7"
        y2="147.5"
      ></line><line class="lt" x1="26.0" y1="147.7" x2="27.3" y2="154.6"></line><line
        class="lt"
        x1="0.0"
        y1="142.0"
        x2="0.0"
        y2="157.0"
      ></line><line class="lt" x1="-26.0" y1="147.7" x2="-27.3" y2="154.6"></line><line
        class="lt"
        x1="-51.3"
        y1="141.0"
        x2="-53.7"
        y2="147.5"
      ></line><line class="lt" x1="-71.0" y1="123.0" x2="-78.5" y2="136.0"></line><line
        class="lt"
        x1="-96.4"
        y1="114.9"
        x2="-100.9"
        y2="120.3"
      ></line><line class="lt" x1="-114.9" y1="96.4" x2="-120.3" y2="100.9"></line><line
        class="lt"
        x1="-123.0"
        y1="71.0"
        x2="-136.0"
        y2="78.5"
      ></line><line class="lt" x1="-141.0" y1="51.3" x2="-147.5" y2="53.7"></line><line
        class="lt"
        x1="-147.7"
        y1="26.0"
        x2="-154.6"
        y2="27.3"
      ></line><line class="lt" x1="-142.0" y1="0.0" x2="-157.0" y2="0.0"></line><line
        class="lt"
        x1="-147.7"
        y1="-26.0"
        x2="-154.6"
        y2="-27.3"
      ></line><line class="lt" x1="-141.0" y1="-51.3" x2="-147.5" y2="-53.7"></line><line
        class="lt"
        x1="-123.0"
        y1="-71.0"
        x2="-136.0"
        y2="-78.5"
      ></line><line class="lt" x1="-114.9" y1="-96.4" x2="-120.3" y2="-100.9"></line><line
        class="lt"
        x1="-96.4"
        y1="-114.9"
        x2="-100.9"
        y2="-120.3"
      ></line><line class="lt" x1="-71.0" y1="-123.0" x2="-78.5" y2="-136.0"></line><line
        class="lt"
        x1="-51.3"
        y1="-141.0"
        x2="-53.7"
        y2="-147.5"
      ></line><line class="lt" x1="-26.0" y1="-147.7" x2="-27.3" y2="-154.6"></line><line
        class="lt"
        x1="-0.0"
        y1="-142.0"
        x2="-0.0"
        y2="-157.0"
      ></line><line class="lt" x1="26.0" y1="-147.7" x2="27.3" y2="-154.6"></line><line
        class="lt"
        x1="51.3"
        y1="-141.0"
        x2="53.7"
        y2="-147.5"
      ></line><line class="lt" x1="71.0" y1="-123.0" x2="78.5" y2="-136.0"></line><line
        class="lt"
        x1="96.4"
        y1="-114.9"
        x2="100.9"
        y2="-120.3"
      ></line><line class="lt" x1="114.9" y1="-96.4" x2="120.3" y2="-100.9"></line><line
        class="lt"
        x1="123.0"
        y1="-71.0"
        x2="136.0"
        y2="-78.5"
      ></line><line class="lt" x1="141.0" y1="-51.3" x2="147.5" y2="-53.7"></line><line
        class="lt"
        x1="147.7"
        y1="-26.0"
        x2="154.6"
        y2="-27.3"
      ></line></g
    ></g
  ><ellipse class="lt" cx="0.0" cy="-10.0" rx="149.4" ry="86.3"></ellipse><g
    ><animateMotion
      path="M-124.9 0 A124.9 72.1 0 0 1 124.9 0 A124.9 72.1 0 0 1 -124.9 0"
      dur="18s"
      begin="0.000s"
      repeatCount="indefinite"
    ></animateMotion><g
      ><animate
        attributeName="opacity"
        values="1;0"
        keyTimes="0;0.5"
        dur="18s"
        begin="0.000s"
        calcMode="discrete"
        repeatCount="indefinite"
      ></animate><polygon class="ln" points="19.1,-10.0 0.0,1.0 0.0,-21.0 19.1,-32.0"></polygon><polygon
        class="ln"
        points="-19.1,-10.0 0.0,1.0 0.0,-21.0 -19.1,-32.0"
      ></polygon><polygon class="ln" points="0.0,-43.0 19.1,-32.0 0.0,-21.0 -19.1,-32.0"></polygon><circle
        class="dot"
        cx="0.0"
        cy="-34.9"
        r=".8"
      ></circle><circle class="dot" cx="-2.5" cy="-33.4" r=".8"></circle><circle class="dot" cx="-5.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="2.5" cy="-33.4" r=".8"></circle><circle class="dot" cx="0.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="-2.5" cy="-30.6" r=".8"></circle><circle class="dot" cx="5.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="2.5" cy="-30.6" r=".8"></circle><circle class="dot" cx="0.0" cy="-29.1" r=".8"
      ></circle></g
    ></g
  ><g
    ><animateMotion
      path="M-124.9 0 A124.9 72.1 0 0 1 124.9 0 A124.9 72.1 0 0 1 -124.9 0"
      dur="18s"
      begin="-3.000s"
      repeatCount="indefinite"
    ></animateMotion><g
      ><animate
        attributeName="opacity"
        values="1;0"
        keyTimes="0;0.5"
        dur="18s"
        begin="-3.000s"
        calcMode="discrete"
        repeatCount="indefinite"
      ></animate><polygon class="ln" points="19.1,-10.0 0.0,1.0 0.0,-21.0 19.1,-32.0"></polygon><polygon
        class="ln"
        points="-19.1,-10.0 0.0,1.0 0.0,-21.0 -19.1,-32.0"
      ></polygon><polygon class="ln" points="0.0,-43.0 19.1,-32.0 0.0,-21.0 -19.1,-32.0"></polygon><circle
        class="dot"
        cx="0.0"
        cy="-34.9"
        r=".8"
      ></circle><circle class="dot" cx="-2.5" cy="-33.4" r=".8"></circle><circle class="dot" cx="-5.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="2.5" cy="-33.4" r=".8"></circle><circle class="dot" cx="0.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="-2.5" cy="-30.6" r=".8"></circle><circle class="dot" cx="5.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="2.5" cy="-30.6" r=".8"></circle><circle class="dot" cx="0.0" cy="-29.1" r=".8"
      ></circle></g
    ></g
  ><g
    ><animateMotion
      path="M-124.9 0 A124.9 72.1 0 0 1 124.9 0 A124.9 72.1 0 0 1 -124.9 0"
      dur="18s"
      begin="-6.000s"
      repeatCount="indefinite"
    ></animateMotion><g
      ><animate
        attributeName="opacity"
        values="1;0"
        keyTimes="0;0.5"
        dur="18s"
        begin="-6.000s"
        calcMode="discrete"
        repeatCount="indefinite"
      ></animate><polygon class="ln" points="19.1,-10.0 0.0,1.0 0.0,-21.0 19.1,-32.0"></polygon><polygon
        class="ln"
        points="-19.1,-10.0 0.0,1.0 0.0,-21.0 -19.1,-32.0"
      ></polygon><polygon class="ln" points="0.0,-43.0 19.1,-32.0 0.0,-21.0 -19.1,-32.0"></polygon><circle
        class="dot"
        cx="0.0"
        cy="-34.9"
        r=".8"
      ></circle><circle class="dot" cx="-2.5" cy="-33.4" r=".8"></circle><circle class="dot" cx="-5.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="2.5" cy="-33.4" r=".8"></circle><circle class="dot" cx="0.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="-2.5" cy="-30.6" r=".8"></circle><circle class="dot" cx="5.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="2.5" cy="-30.6" r=".8"></circle><circle class="dot" cx="0.0" cy="-29.1" r=".8"
      ></circle></g
    ></g
  ><g
    ><animateMotion
      path="M-124.9 0 A124.9 72.1 0 0 1 124.9 0 A124.9 72.1 0 0 1 -124.9 0"
      dur="18s"
      begin="-9.000s"
      repeatCount="indefinite"
    ></animateMotion><g
      ><animate
        attributeName="opacity"
        values="1;0"
        keyTimes="0;0.5"
        dur="18s"
        begin="-9.000s"
        calcMode="discrete"
        repeatCount="indefinite"
      ></animate><polygon class="ln" points="19.1,-10.0 0.0,1.0 0.0,-21.0 19.1,-32.0"></polygon><polygon
        class="ln"
        points="-19.1,-10.0 0.0,1.0 0.0,-21.0 -19.1,-32.0"
      ></polygon><polygon class="ln" points="0.0,-43.0 19.1,-32.0 0.0,-21.0 -19.1,-32.0"></polygon><circle
        class="dot"
        cx="0.0"
        cy="-34.9"
        r=".8"
      ></circle><circle class="dot" cx="-2.5" cy="-33.4" r=".8"></circle><circle class="dot" cx="-5.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="2.5" cy="-33.4" r=".8"></circle><circle class="dot" cx="0.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="-2.5" cy="-30.6" r=".8"></circle><circle class="dot" cx="5.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="2.5" cy="-30.6" r=".8"></circle><circle class="dot" cx="0.0" cy="-29.1" r=".8"
      ></circle></g
    ></g
  ><g
    ><animateMotion
      path="M-124.9 0 A124.9 72.1 0 0 1 124.9 0 A124.9 72.1 0 0 1 -124.9 0"
      dur="18s"
      begin="-12.000s"
      repeatCount="indefinite"
    ></animateMotion><g
      ><animate
        attributeName="opacity"
        values="1;0"
        keyTimes="0;0.5"
        dur="18s"
        begin="-12.000s"
        calcMode="discrete"
        repeatCount="indefinite"
      ></animate><polygon class="ln" points="19.1,-10.0 0.0,1.0 0.0,-21.0 19.1,-32.0"></polygon><polygon
        class="ln"
        points="-19.1,-10.0 0.0,1.0 0.0,-21.0 -19.1,-32.0"
      ></polygon><polygon class="ln" points="0.0,-43.0 19.1,-32.0 0.0,-21.0 -19.1,-32.0"></polygon><circle
        class="dot"
        cx="0.0"
        cy="-34.9"
        r=".8"
      ></circle><circle class="dot" cx="-2.5" cy="-33.4" r=".8"></circle><circle class="dot" cx="-5.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="2.5" cy="-33.4" r=".8"></circle><circle class="dot" cx="0.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="-2.5" cy="-30.6" r=".8"></circle><circle class="dot" cx="5.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="2.5" cy="-30.6" r=".8"></circle><circle class="dot" cx="0.0" cy="-29.1" r=".8"
      ></circle></g
    ></g
  ><g
    ><animateMotion
      path="M-124.9 0 A124.9 72.1 0 0 1 124.9 0 A124.9 72.1 0 0 1 -124.9 0"
      dur="18s"
      begin="-15.000s"
      repeatCount="indefinite"
    ></animateMotion><g
      ><animate
        attributeName="opacity"
        values="1;0"
        keyTimes="0;0.5"
        dur="18s"
        begin="-15.000s"
        calcMode="discrete"
        repeatCount="indefinite"
      ></animate><polygon class="ln" points="19.1,-10.0 0.0,1.0 0.0,-21.0 19.1,-32.0"></polygon><polygon
        class="ln"
        points="-19.1,-10.0 0.0,1.0 0.0,-21.0 -19.1,-32.0"
      ></polygon><polygon class="ln" points="0.0,-43.0 19.1,-32.0 0.0,-21.0 -19.1,-32.0"></polygon><circle
        class="dot"
        cx="0.0"
        cy="-34.9"
        r=".8"
      ></circle><circle class="dot" cx="-2.5" cy="-33.4" r=".8"></circle><circle class="dot" cx="-5.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="2.5" cy="-33.4" r=".8"></circle><circle class="dot" cx="0.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="-2.5" cy="-30.6" r=".8"></circle><circle class="dot" cx="5.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="2.5" cy="-30.6" r=".8"></circle><circle class="dot" cx="0.0" cy="-29.1" r=".8"
      ></circle></g
    ></g
  ><polygon class="ink" points="22.5,-10.0 0.0,3.0 0.0,-37.0 22.5,-50.0"></polygon><polygon
    class="ink"
    points="-22.5,-10.0 0.0,3.0 0.0,-37.0 -22.5,-50.0"
  ></polygon><polygon class="ink" points="0.0,-63.0 22.5,-50.0 0.0,-37.0 -22.5,-50.0"></polygon><circle
    class="ink"
    cx="0.0"
    cy="-62.0"
    r="10"
  ></circle><g
    ><animateMotion
      path="M-124.9 0 A124.9 72.1 0 0 1 124.9 0 A124.9 72.1 0 0 1 -124.9 0"
      dur="18s"
      begin="0.000s"
      repeatCount="indefinite"
    ></animateMotion><g
      ><animate
        attributeName="opacity"
        values="0;1"
        keyTimes="0;0.5"
        dur="18s"
        begin="0.000s"
        calcMode="discrete"
        repeatCount="indefinite"
      ></animate><polygon class="ln" points="19.1,-10.0 0.0,1.0 0.0,-21.0 19.1,-32.0"></polygon><polygon
        class="ln"
        points="-19.1,-10.0 0.0,1.0 0.0,-21.0 -19.1,-32.0"
      ></polygon><polygon class="ln" points="0.0,-43.0 19.1,-32.0 0.0,-21.0 -19.1,-32.0"></polygon><circle
        class="dot"
        cx="0.0"
        cy="-34.9"
        r=".8"
      ></circle><circle class="dot" cx="-2.5" cy="-33.4" r=".8"></circle><circle class="dot" cx="-5.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="2.5" cy="-33.4" r=".8"></circle><circle class="dot" cx="0.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="-2.5" cy="-30.6" r=".8"></circle><circle class="dot" cx="5.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="2.5" cy="-30.6" r=".8"></circle><circle class="dot" cx="0.0" cy="-29.1" r=".8"
      ></circle></g
    ></g
  ><g
    ><animateMotion
      path="M-124.9 0 A124.9 72.1 0 0 1 124.9 0 A124.9 72.1 0 0 1 -124.9 0"
      dur="18s"
      begin="-3.000s"
      repeatCount="indefinite"
    ></animateMotion><g
      ><animate
        attributeName="opacity"
        values="0;1"
        keyTimes="0;0.5"
        dur="18s"
        begin="-3.000s"
        calcMode="discrete"
        repeatCount="indefinite"
      ></animate><polygon class="ln" points="19.1,-10.0 0.0,1.0 0.0,-21.0 19.1,-32.0"></polygon><polygon
        class="ln"
        points="-19.1,-10.0 0.0,1.0 0.0,-21.0 -19.1,-32.0"
      ></polygon><polygon class="ln" points="0.0,-43.0 19.1,-32.0 0.0,-21.0 -19.1,-32.0"></polygon><circle
        class="dot"
        cx="0.0"
        cy="-34.9"
        r=".8"
      ></circle><circle class="dot" cx="-2.5" cy="-33.4" r=".8"></circle><circle class="dot" cx="-5.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="2.5" cy="-33.4" r=".8"></circle><circle class="dot" cx="0.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="-2.5" cy="-30.6" r=".8"></circle><circle class="dot" cx="5.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="2.5" cy="-30.6" r=".8"></circle><circle class="dot" cx="0.0" cy="-29.1" r=".8"
      ></circle></g
    ></g
  ><g
    ><animateMotion
      path="M-124.9 0 A124.9 72.1 0 0 1 124.9 0 A124.9 72.1 0 0 1 -124.9 0"
      dur="18s"
      begin="-6.000s"
      repeatCount="indefinite"
    ></animateMotion><g
      ><animate
        attributeName="opacity"
        values="0;1"
        keyTimes="0;0.5"
        dur="18s"
        begin="-6.000s"
        calcMode="discrete"
        repeatCount="indefinite"
      ></animate><polygon class="ln" points="19.1,-10.0 0.0,1.0 0.0,-21.0 19.1,-32.0"></polygon><polygon
        class="ln"
        points="-19.1,-10.0 0.0,1.0 0.0,-21.0 -19.1,-32.0"
      ></polygon><polygon class="ln" points="0.0,-43.0 19.1,-32.0 0.0,-21.0 -19.1,-32.0"></polygon><circle
        class="dot"
        cx="0.0"
        cy="-34.9"
        r=".8"
      ></circle><circle class="dot" cx="-2.5" cy="-33.4" r=".8"></circle><circle class="dot" cx="-5.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="2.5" cy="-33.4" r=".8"></circle><circle class="dot" cx="0.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="-2.5" cy="-30.6" r=".8"></circle><circle class="dot" cx="5.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="2.5" cy="-30.6" r=".8"></circle><circle class="dot" cx="0.0" cy="-29.1" r=".8"
      ></circle></g
    ></g
  ><g
    ><animateMotion
      path="M-124.9 0 A124.9 72.1 0 0 1 124.9 0 A124.9 72.1 0 0 1 -124.9 0"
      dur="18s"
      begin="-9.000s"
      repeatCount="indefinite"
    ></animateMotion><g
      ><animate
        attributeName="opacity"
        values="0;1"
        keyTimes="0;0.5"
        dur="18s"
        begin="-9.000s"
        calcMode="discrete"
        repeatCount="indefinite"
      ></animate><polygon class="ln" points="19.1,-10.0 0.0,1.0 0.0,-21.0 19.1,-32.0"></polygon><polygon
        class="ln"
        points="-19.1,-10.0 0.0,1.0 0.0,-21.0 -19.1,-32.0"
      ></polygon><polygon class="ln" points="0.0,-43.0 19.1,-32.0 0.0,-21.0 -19.1,-32.0"></polygon><circle
        class="dot"
        cx="0.0"
        cy="-34.9"
        r=".8"
      ></circle><circle class="dot" cx="-2.5" cy="-33.4" r=".8"></circle><circle class="dot" cx="-5.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="2.5" cy="-33.4" r=".8"></circle><circle class="dot" cx="0.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="-2.5" cy="-30.6" r=".8"></circle><circle class="dot" cx="5.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="2.5" cy="-30.6" r=".8"></circle><circle class="dot" cx="0.0" cy="-29.1" r=".8"
      ></circle></g
    ></g
  ><g
    ><animateMotion
      path="M-124.9 0 A124.9 72.1 0 0 1 124.9 0 A124.9 72.1 0 0 1 -124.9 0"
      dur="18s"
      begin="-12.000s"
      repeatCount="indefinite"
    ></animateMotion><g
      ><animate
        attributeName="opacity"
        values="0;1"
        keyTimes="0;0.5"
        dur="18s"
        begin="-12.000s"
        calcMode="discrete"
        repeatCount="indefinite"
      ></animate><polygon class="ln" points="19.1,-10.0 0.0,1.0 0.0,-21.0 19.1,-32.0"></polygon><polygon
        class="ln"
        points="-19.1,-10.0 0.0,1.0 0.0,-21.0 -19.1,-32.0"
      ></polygon><polygon class="ln" points="0.0,-43.0 19.1,-32.0 0.0,-21.0 -19.1,-32.0"></polygon><circle
        class="dot"
        cx="0.0"
        cy="-34.9"
        r=".8"
      ></circle><circle class="dot" cx="-2.5" cy="-33.4" r=".8"></circle><circle class="dot" cx="-5.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="2.5" cy="-33.4" r=".8"></circle><circle class="dot" cx="0.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="-2.5" cy="-30.6" r=".8"></circle><circle class="dot" cx="5.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="2.5" cy="-30.6" r=".8"></circle><circle class="dot" cx="0.0" cy="-29.1" r=".8"
      ></circle></g
    ></g
  ><g
    ><animateMotion
      path="M-124.9 0 A124.9 72.1 0 0 1 124.9 0 A124.9 72.1 0 0 1 -124.9 0"
      dur="18s"
      begin="-15.000s"
      repeatCount="indefinite"
    ></animateMotion><g
      ><animate
        attributeName="opacity"
        values="0;1"
        keyTimes="0;0.5"
        dur="18s"
        begin="-15.000s"
        calcMode="discrete"
        repeatCount="indefinite"
      ></animate><polygon class="ln" points="19.1,-10.0 0.0,1.0 0.0,-21.0 19.1,-32.0"></polygon><polygon
        class="ln"
        points="-19.1,-10.0 0.0,1.0 0.0,-21.0 -19.1,-32.0"
      ></polygon><polygon class="ln" points="0.0,-43.0 19.1,-32.0 0.0,-21.0 -19.1,-32.0"></polygon><circle
        class="dot"
        cx="0.0"
        cy="-34.9"
        r=".8"
      ></circle><circle class="dot" cx="-2.5" cy="-33.4" r=".8"></circle><circle class="dot" cx="-5.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="2.5" cy="-33.4" r=".8"></circle><circle class="dot" cx="0.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="-2.5" cy="-30.6" r=".8"></circle><circle class="dot" cx="5.0" cy="-32.0" r=".8"
      ></circle><circle class="dot" cx="2.5" cy="-30.6" r=".8"></circle><circle class="dot" cx="0.0" cy="-29.1" r=".8"
      ></circle></g
    ></g
  ><g opacity="0"
    ><animate
      attributeName="opacity"
      values="0;1;1;0;0"
      keyTimes="0;0.08;0.55;0.64;1"
      dur="3.0s"
      begin="-1.680s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animate><path
      class="ln"
      d="M26.0 -126.0 H110.0 Q118.0 -126.0 118.0 -118.0 V-96.0 Q118.0 -88.0 110.0 -88.0 H40.0 L8.0 -76.0 L30.0 -88.0 H26.0 Q18.0 -88.0 18.0 -96.0 V-118.0 Q18.0 -126.0 26.0 -126.0 Z"
    ></path><line class="lo" x1="30.0" y1="-116.0" x2="100.0" y2="-116.0"></line><line
      class="lo"
      x1="30.0"
      y1="-107.0"
      x2="90.0"
      y2="-107.0"
    ></line><line class="lo" x1="30.0" y1="-98.0" x2="70.0" y2="-98.0"></line></g
  ><circle class="ln" cx="175" cy="-128" r="17"></circle><line class="lt" x1="188.0" y1="-128.0" x2="191.0" y2="-128.0"
  ></line><line class="lt" x1="186.3" y1="-121.5" x2="188.9" y2="-120.0"></line><line
    class="lt"
    x1="181.5"
    y1="-116.7"
    x2="183.0"
    y2="-114.1"
  ></line><line class="lt" x1="175.0" y1="-115.0" x2="175.0" y2="-112.0"></line><line
    class="lt"
    x1="168.5"
    y1="-116.7"
    x2="167.0"
    y2="-114.1"
  ></line><line class="lt" x1="163.7" y1="-121.5" x2="161.1" y2="-120.0"></line><line
    class="lt"
    x1="162.0"
    y1="-128.0"
    x2="159.0"
    y2="-128.0"
  ></line><line class="lt" x1="163.7" y1="-134.5" x2="161.1" y2="-136.0"></line><line
    class="lt"
    x1="168.5"
    y1="-139.3"
    x2="167.0"
    y2="-141.9"
  ></line><line class="lt" x1="175.0" y1="-141.0" x2="175.0" y2="-144.0"></line><line
    class="lt"
    x1="181.5"
    y1="-139.3"
    x2="183.0"
    y2="-141.9"
  ></line><line class="lt" x1="186.3" y1="-134.5" x2="188.9" y2="-136.0"></line><line
    class="lo"
    x1="175"
    y1="-128"
    x2="182"
    y2="-128"
  ></line><g
    ><animateTransform
      attributeName="transform"
      type="rotate"
      values="0 175 -128;360 175 -128"
      dur="3.0s"
      begin="-1.680s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animateTransform><line class="ko" x1="175" y1="-128" x2="175" y2="-140"></line></g
  ><circle class="kf" cx="175" cy="-128" r="1.6"></circle>
</MachineFrame>
