<!-- <script>
  import moment from 'moment';
  import SvelteHeatmap from 'svelte-heatmap/src/SvelteHeatmap.svelte';

  // Generate a random number
  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Generate dummy data for a heatmap
  function generateFakeData() {
    const data = [];
    const date = moment().subtract(1, 'year');
    const now = moment();

    while (date.isBefore(now)) {
      data.push({
        date: date.toDate(),
        value: rand(0, 4)
      });

      date.add(1, 'day');
    }

    return data;
  }

  const fakeData = generateFakeData();
</script>

<section class="w-full mb-4">
  <p class="font-semibold mb-2">Student Activities</p>
  <div class="w-full mx-auto my-auto border border-gray-300 p-4">
    <SvelteHeatmap
      data={fakeData}
      monthGap={20}
      endDate={moment().toDate()}
      startDate={moment().subtract(5, 'months').toDate()}
    />
  </div>
</section>

<style>
</style> -->

<script>
  import { activities } from '$lib/components/Courses/store';

  // import svelteLogo from './assets/svelte.svg'

  import ActivityCalendarWidget from 'activity-calendar-widget/svelte';
</script>

<div class="mb-4">
  <!-- <div> 
      <img src={svelteLogo} alt={'Svelte logo'}/>
    </div> -->
  <p class="font-semibold mb-2">Student Activities</p>
  <div class="border border-gray-200 rounded p-4">
    <ActivityCalendarWidget
      daysToRender={200}
      data={$activities}
      clickHandler={(dateInfo) => console.log({ dateInfo })}
    />
  </div>
</div>
