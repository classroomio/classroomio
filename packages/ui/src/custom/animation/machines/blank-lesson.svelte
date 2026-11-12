<script lang="ts">
  import MachineFrame from './machine-frame.svelte';
  import type { MachineProps } from './types';

  interface Props extends MachineProps {
    heading?: string;
  }

  let { label, stillAt = 3, class: className, heading = 'LESSON' }: Props = $props();
</script>

<MachineFrame viewBox="-157 -26 304 199" {label} {stillAt} class={className}>
  <polygon class="ln" points="-138.6,80.0 -8.7,155.0 -8.7,147.0 -138.6,72.0"></polygon><polygon
    class="ln"
    points="129.9,75.0 -8.7,155.0 -8.7,147.0 129.9,67.0"
  ></polygon><polygon class="ln" points="0.0,-8.0 129.9,67.0 -8.7,147.0 -138.6,72.0"></polygon><g
    transform="matrix(0.8660 0.5000 -0.8660 0.5000 0.0 -8.0)"
    ><text class="tx" x="16" y="13" style="font-size: 6px; letter-spacing: 0.08em;">{heading}</text></g
  ><polygon class="lt dash" points="-3.5,10.0 98.7,69.0 86.6,76.0 -15.6,17.0"></polygon><polygon
    class="lt dash"
    points="-26.0,23.0 76.2,82.0 22.5,113.0 -79.7,54.0"
  ></polygon><polygon class="lo" points="1.7,57.0 -20.8,70.0 9.5,74.5"></polygon><line
    class="lt dash"
    x1="-93.5"
    y1="62.0"
    x2="0.0"
    y2="116.0"
  ></line><line class="lt dash" x1="-107.4" y1="70.0" x2="-41.6" y2="108.0"></line><line
    class="tr"
    x1="-7.8"
    y1="14.2"
    x2="-7.8"
    y2="14.2"
    ><animate
      attributeName="x2"
      values="-7.8;-7.8;71.9;71.9;-7.8;-7.8"
      keyTimes="0.0000;0.2000;0.5500;0.6750;0.8250;1.0000"
      calcMode="spline"
      keySplines=".42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1"
      dur="8s"
      repeatCount="indefinite"
    ></animate><animate
      attributeName="y2"
      values="14.2;14.2;60.2;60.2;14.2;14.2"
      keyTimes="0.0000;0.2000;0.5500;0.6750;0.8250;1.0000"
      calcMode="spline"
      keySplines=".42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1"
      dur="8s"
      repeatCount="indefinite"
    ></animate></line
  ><g
    ><animateTransform
      attributeName="transform"
      type="translate"
      values="0.0,0.0;0.0,0.0;79.7,46.0;79.7,46.0;0.0,0.0;0.0,0.0"
      keyTimes="0;0.2;0.55;0.675;0.825;1"
      calcMode="spline"
      keySplines=".42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1"
      dur="8s"
      repeatCount="indefinite"
    ></animateTransform><g
      ><animate
        attributeName="opacity"
        values="1;0;1;0;1;1;0;1;0;1;1"
        keyTimes="0.0000;0.0625;0.1250;0.1875;0.2000;0.5500;0.6125;0.6750;0.8875;0.9500;1.0000"
        calcMode="discrete"
        dur="8s"
        repeatCount="indefinite"
      ></animate><polygon class="ink" points="-13.9,19.0 -11.6,20.3 -11.6,17.3 -13.9,16.0"></polygon><polygon
        class="ink"
        points="2.3,12.3 -11.6,20.3 -11.6,17.3 2.3,9.3"
      ></polygon><polygon class="kf" points="0.0,8.0 2.3,9.3 -11.6,17.3 -13.9,16.0"></polygon></g
    ></g
  >
</MachineFrame>
