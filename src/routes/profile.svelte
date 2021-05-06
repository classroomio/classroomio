<script>
  let photos = [];
</script>

<svelte:head>
  <title>Profile</title>
</svelte:head>

<div class="root">
  <figure>
    <img
      src="https://pbs.twimg.com/media/EzHwj4wVgAEVbUY?format=jpg&name=4096x4096"
      alt="Elon musk"
    />
    <figcaption>Elon musk</figcaption>
  </figure>
  <p>
    NASA has selected Starship to land the first astronauts on the lunar surface
    since the Apollo program! We are humbled to help @NASAArtemis usher in a new
    era of human space exploration → http://go.nasa.gov/3tur510
  </p>
  <button
    class="bg-blue-700 hover:bg-blue-900 text-white font-bold py-1 px-3 rounded"
  >
    Connect
  </button>
</div>

<style>
  .root {
    max-width: 600px;
    margin: 20px auto;
    border-left: 1px solid var(--border-color);
    border-right: 1px solid var(--border-color);
    text-align: center;
    padding: 5px;
  }

  figure {
    margin-bottom: 10px;
  }
  img {
    width: 100px;
    height: 100px;
    margin: 0 auto;
    border-radius: 50%;
  }
</style>
