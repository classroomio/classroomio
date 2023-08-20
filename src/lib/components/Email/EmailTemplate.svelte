<script>
  import Avatar from '$lib/components/Avatar/index.svelte';
</script>

<main>
  <div class="w-full min-h-screen flex items-center justify-center">
    <div class="container border border-gray bg-white">
      <div class="flex items-center flex-col p-2 lg:px-8 lg:py-3">
        <div class="flex items-center justify-center w-full pt-2">
          <Avatar
            src={'/logo-192.png'}
            name={'ClassroomIO'}
            shape="rounded-md"
            width="w-10"
            height="h-10"
            className="mr-2"
          />
          <h4 class="text-xl">ClassroomIO</h4>
        </div>
        <div class="flex items-center flex-col w-10/12">
          <h3>Welcome to ClassroomIO.</h3>
        </div>
      </div>

      <!-- Footer -->
      <div class="w-full p-6 border-t border-grey text-center">
        Already have an account? <a class="hover:underline text-primary-700" href="/login">Log In</a
        >
      </div>
    </div>
  </div>
</main>

<style>
  .container {
    width: 450px;
  }
  main {
    background: linear-gradient(
      138deg,
      rgb(32, 201, 255) 36.7%,
      rgb(0, 8, 187) 84.4%,
      rgb(255, 255, 255) 119.7%
    );
    box-sizing: border-box;
  }
</style>
