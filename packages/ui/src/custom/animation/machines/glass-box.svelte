<script lang="ts">
  import MachineFrame from './machine-frame.svelte';
  import type { MachineProps } from './types';

  interface Props extends MachineProps {
    price?: string;
  }

  let { label, stillAt, class: className, price = '69/mo' }: Props = $props();
</script>

<MachineFrame viewBox="-152 -152 364 359" {label} {stillAt} class={className}>
  <line class="lt dash" x1="0.0" y1="0.0" x2="190.5" y2="110.0"></line><line
    class="lt dash"
    x1="0.0"
    y1="0.0"
    x2="-129.9"
    y2="75.0"
  ></line><line class="lt dash" x1="0.0" y1="0.0" x2="0.0" y2="-130.0"></line><polygon
    class="ln"
    points="109.1,77.0 102.2,81.0 102.2,75.0 109.1,71.0"
  ></polygon><polygon class="ln" points="6.9,26.0 102.2,81.0 102.2,75.0 6.9,20.0"></polygon><polygon
    class="ln"
    points="13.9,16.0 109.1,71.0 102.2,75.0 6.9,20.0"
  ></polygon><g transform="matrix(0.8660 0.5000 0.0000 1.0000 -1.7 -91.0)"
    ><g
      ><animateTransform
        attributeName="transform"
        type="rotate"
        values="0 60 58;360 60 58"
        dur="12s"
        begin="0.000s"
        calcMode="linear"
        repeatCount="indefinite"
      ></animateTransform><polygon
        class="ln"
        points="86.0,58.0 91.8,61.3 90.9,66.3 84.3,67.3 82.5,71.0 85.9,76.8 82.6,80.6 76.4,78.2 73.0,80.5 73.0,87.2 68.3,88.9 64.1,83.7 60.0,84.0 56.7,89.8 51.7,88.9 50.7,82.3 47.0,80.5 41.2,83.9 37.4,80.6 39.8,74.4 37.5,71.0 30.8,71.0 29.1,66.3 34.3,62.1 34.0,58.0 28.2,54.7 29.1,49.7 35.7,48.7 37.5,45.0 34.1,39.2 37.4,35.4 43.6,37.8 47.0,35.5 47.0,28.8 51.7,27.1 55.9,32.3 60.0,32.0 63.3,26.2 68.3,27.1 69.3,33.7 73.0,35.5 78.8,32.1 82.6,35.4 80.2,41.6 82.5,45.0 89.2,45.0 90.9,49.7 85.7,53.9"
      ></polygon><circle class="lo" cx="60" cy="58" r="9.1"></circle><line
        class="lt"
        x1="69.1"
        y1="58.0"
        x2="82.1"
        y2="58.0"
      ></line><line class="lt" x1="60.0" y1="67.1" x2="60.0" y2="80.1"></line><line
        class="lt"
        x1="50.9"
        y1="58.0"
        x2="37.9"
        y2="58.0"
      ></line><line class="lt" x1="60.0" y1="48.9" x2="60.0" y2="35.9"></line></g
    ><g
      ><animateTransform
        attributeName="transform"
        type="rotate"
        values="0 103 46;-360 103 46"
        dur="6.923076923076923s"
        begin="0.000s"
        calcMode="linear"
        repeatCount="indefinite"
      ></animateTransform><polygon
        class="ln"
        points="118.0,46.0 122.8,49.1 121.5,53.7 115.8,53.8 113.6,56.6 114.8,62.2 110.7,64.5 106.5,60.6 103.0,61.0 99.9,65.8 95.3,64.5 95.2,58.8 92.4,56.6 86.8,57.8 84.5,53.7 88.4,49.5 88.0,46.0 83.2,42.9 84.5,38.3 90.2,38.2 92.4,35.4 91.2,29.8 95.3,27.5 99.5,31.4 103.0,31.0 106.1,26.2 110.7,27.5 110.8,33.2 113.6,35.4 119.2,34.2 121.5,38.3 117.6,42.5"
      ></polygon><circle class="lo" cx="103" cy="46" r="5.2"></circle><line
        class="lt"
        x1="108.2"
        y1="46.0"
        x2="115.8"
        y2="46.0"
      ></line><line class="lt" x1="103.0" y1="51.2" x2="103.0" y2="58.8"></line><line
        class="lt"
        x1="97.8"
        y1="46.0"
        x2="90.2"
        y2="46.0"
      ></line><line class="lt" x1="103.0" y1="40.8" x2="103.0" y2="33.2"></line></g
    ></g
  ><polygon class="ln" points="110.9,136.0 76.2,156.0 76.2,150.0 110.9,130.0"></polygon><polygon
    class="ln"
    points="-79.7,66.0 76.2,156.0 76.2,150.0 -79.7,60.0"
  ></polygon><polygon class="ln" points="-45.0,40.0 110.9,130.0 76.2,150.0 -79.7,60.0"></polygon><line
    class="lt"
    x1="-29.4"
    y1="51.0"
    x2="-60.6"
    y2="69.0"
  ></line><line class="lt" x1="-8.7" y1="63.0" x2="-39.8" y2="81.0"></line><line
    class="lt"
    x1="12.1"
    y1="75.0"
    x2="-19.1"
    y2="93.0"
  ></line><line class="lt" x1="32.9" y1="87.0" x2="1.7" y2="105.0"></line><line
    class="lt"
    x1="53.7"
    y1="99.0"
    x2="22.5"
    y2="117.0"
  ></line><line class="lt" x1="74.5" y1="111.0" x2="43.3" y2="129.0"></line><line
    class="lt"
    x1="95.3"
    y1="123.0"
    x2="64.1"
    y2="141.0"
  ></line><g opacity="0"
    ><animate
      attributeName="opacity"
      values="0;1;1;0"
      keyTimes="0;0.04;0.94;1"
      dur="8s"
      begin="0.000s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animate><animateTransform
      attributeName="transform"
      type="translate"
      values="0 0;135.1 78.0"
      dur="8s"
      begin="0.000s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animateTransform><polygon class="ln" points="-38.1,56.0 -52.0,64.0 -52.0,48.0 -38.1,40.0"></polygon><polygon
      class="ln"
      points="-65.8,56.0 -52.0,64.0 -52.0,48.0 -65.8,40.0"
    ></polygon><polygon class="ln" points="-52.0,32.0 -38.1,40.0 -52.0,48.0 -65.8,40.0"></polygon><circle
      class="dot"
      cx="-52.0"
      cy="37.9"
      r=".8"
    ></circle><circle class="dot" cx="-53.8" cy="39.0" r=".8"></circle><circle class="dot" cx="-55.6" cy="40.0" r=".8"
    ></circle><circle class="dot" cx="-50.2" cy="39.0" r=".8"></circle><circle class="dot" cx="-52.0" cy="40.0" r=".8"
    ></circle><circle class="dot" cx="-53.8" cy="41.0" r=".8"></circle><circle class="dot" cx="-48.4" cy="40.0" r=".8"
    ></circle><circle class="dot" cx="-50.2" cy="41.0" r=".8"></circle><circle class="dot" cx="-52.0" cy="42.1" r=".8"
    ></circle></g
  ><g opacity="0"
    ><animate
      attributeName="opacity"
      values="0;1;1;0"
      keyTimes="0;0.04;0.94;1"
      dur="8s"
      begin="-2.000s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animate><animateTransform
      attributeName="transform"
      type="translate"
      values="0 0;135.1 78.0"
      dur="8s"
      begin="-2.000s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animateTransform><polygon class="ln" points="-38.1,56.0 -52.0,64.0 -52.0,48.0 -38.1,40.0"></polygon><polygon
      class="ln"
      points="-65.8,56.0 -52.0,64.0 -52.0,48.0 -65.8,40.0"
    ></polygon><polygon class="ln" points="-52.0,32.0 -38.1,40.0 -52.0,48.0 -65.8,40.0"></polygon><circle
      class="dot"
      cx="-52.0"
      cy="37.9"
      r=".8"
    ></circle><circle class="dot" cx="-53.8" cy="39.0" r=".8"></circle><circle class="dot" cx="-55.6" cy="40.0" r=".8"
    ></circle><circle class="dot" cx="-50.2" cy="39.0" r=".8"></circle><circle class="dot" cx="-52.0" cy="40.0" r=".8"
    ></circle><circle class="dot" cx="-53.8" cy="41.0" r=".8"></circle><circle class="dot" cx="-48.4" cy="40.0" r=".8"
    ></circle><circle class="dot" cx="-50.2" cy="41.0" r=".8"></circle><circle class="dot" cx="-52.0" cy="42.1" r=".8"
    ></circle></g
  ><g opacity="0"
    ><animate
      attributeName="opacity"
      values="0;1;1;0"
      keyTimes="0;0.04;0.94;1"
      dur="8s"
      begin="-4.000s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animate><animateTransform
      attributeName="transform"
      type="translate"
      values="0 0;135.1 78.0"
      dur="8s"
      begin="-4.000s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animateTransform><polygon class="ln" points="-38.1,56.0 -52.0,64.0 -52.0,48.0 -38.1,40.0"></polygon><polygon
      class="ln"
      points="-65.8,56.0 -52.0,64.0 -52.0,48.0 -65.8,40.0"
    ></polygon><polygon class="ln" points="-52.0,32.0 -38.1,40.0 -52.0,48.0 -65.8,40.0"></polygon><circle
      class="dot"
      cx="-52.0"
      cy="37.9"
      r=".8"
    ></circle><circle class="dot" cx="-53.8" cy="39.0" r=".8"></circle><circle class="dot" cx="-55.6" cy="40.0" r=".8"
    ></circle><circle class="dot" cx="-50.2" cy="39.0" r=".8"></circle><circle class="dot" cx="-52.0" cy="40.0" r=".8"
    ></circle><circle class="dot" cx="-53.8" cy="41.0" r=".8"></circle><circle class="dot" cx="-48.4" cy="40.0" r=".8"
    ></circle><circle class="dot" cx="-50.2" cy="41.0" r=".8"></circle><circle class="dot" cx="-52.0" cy="42.1" r=".8"
    ></circle></g
  ><g opacity="0"
    ><animate
      attributeName="opacity"
      values="0;1;1;0"
      keyTimes="0;0.04;0.94;1"
      dur="8s"
      begin="-6.000s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animate><animateTransform
      attributeName="transform"
      type="translate"
      values="0 0;135.1 78.0"
      dur="8s"
      begin="-6.000s"
      calcMode="linear"
      repeatCount="indefinite"
    ></animateTransform><polygon class="ln" points="-38.1,56.0 -52.0,64.0 -52.0,48.0 -38.1,40.0"></polygon><polygon
      class="ln"
      points="-65.8,56.0 -52.0,64.0 -52.0,48.0 -65.8,40.0"
    ></polygon><polygon class="ln" points="-52.0,32.0 -38.1,40.0 -52.0,48.0 -65.8,40.0"></polygon><circle
      class="dot"
      cx="-52.0"
      cy="37.9"
      r=".8"
    ></circle><circle class="dot" cx="-53.8" cy="39.0" r=".8"></circle><circle class="dot" cx="-55.6" cy="40.0" r=".8"
    ></circle><circle class="dot" cx="-50.2" cy="39.0" r=".8"></circle><circle class="dot" cx="-52.0" cy="40.0" r=".8"
    ></circle><circle class="dot" cx="-53.8" cy="41.0" r=".8"></circle><circle class="dot" cx="-48.4" cy="40.0" r=".8"
    ></circle><circle class="dot" cx="-50.2" cy="41.0" r=".8"></circle><circle class="dot" cx="-52.0" cy="42.1" r=".8"
    ></circle></g
  ><line class="lo" x1="190.5" y1="110.0" x2="60.6" y2="185.0"></line><line
    class="lo"
    x1="-129.9"
    y1="75.0"
    x2="60.6"
    y2="185.0"
  ></line><line class="lo" x1="190.5" y1="110.0" x2="190.5" y2="-20.0"></line><line
    class="lo"
    x1="-129.9"
    y1="75.0"
    x2="-129.9"
    y2="-55.0"
  ></line><line class="lo" x1="60.6" y1="185.0" x2="60.6" y2="55.0"></line><line
    class="lo"
    x1="0.0"
    y1="-130.0"
    x2="190.5"
    y2="-20.0"
  ></line><line class="lo" x1="0.0" y1="-130.0" x2="-129.9" y2="-55.0"></line><line
    class="lo"
    x1="190.5"
    y1="-20.0"
    x2="60.6"
    y2="55.0"
  ></line><line class="lo" x1="-129.9" y1="-55.0" x2="60.6" y2="55.0"></line><line
    class="lt"
    x1="164.5"
    y1="25.0"
    x2="138.6"
    y2="70.0"
  ></line><line class="lt" x1="169.7" y1="42.0" x2="157.6" y2="63.0"></line><g
    ><animateTransform
      attributeName="transform"
      type="rotate"
      values="-4 60.6 55.0;5 60.6 55.0;-4 60.6 55.0"
      dur="4s"
      begin="0.000s"
      calcMode="spline"
      repeatCount="indefinite"
      keySplines=".45 0 .55 1;.45 0 .55 1"
    ></animateTransform><path class="lo" d="M60.6 55.0 Q74.6 63.0 82.6 81.0"></path><g
      transform="translate(82.6 81.0) rotate(-18)"
      ><path class="ink" d="M0 0 L12 -10 H62 V10 H12 Z"></path><circle class="ko" cx="8" cy="0" r="2"></circle><text
        class="tk"
        x="20"
        y="3"
        style="font-size: 9px; font-weight: 600;">{price}</text
      ></g
    ><text class="tx" x="100.6" y="107.0" style="font-size: 7px;">or self-host it</text></g
  >
</MachineFrame>
