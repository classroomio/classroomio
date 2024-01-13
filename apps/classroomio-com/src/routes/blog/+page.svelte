<script>
  import Chip from '$lib/Chip/index.svelte';
</script>

<div class="relative mx-auto max-w-screen-xl flex-1 px-4 lg:px-8">
  <div class="mt-6 sm:mt-12">
    <div class="text-center">
      <h1 class="text-3xl font-bold lg:text-5xl">From the blog</h1>
      <p class="text-muted-foreground mx-auto mt-4 max-w-xl text-center text-lg leading-normal">
        Get the latest news from Documenso, including product updates, team announcements and more!
      </p>
    </div>
    <div class="divide-muted-foreground/20 border-muted-foreground/20 mt-10 divide-y border-t">
      <article
        class="mx-auto mt-8 flex max-w-xl flex-col items-start justify-between pt-8 first:pt-0 sm:mt-16 sm:pt-16"
      >
        <div class="flex items-center gap-x-4 text-xs">
          <time datetime="2023-09-29T00:00:00.000Z" class="text-muted-foreground">9/29/2023</time>
          <ul class="flex flex-row space-x-2">
            <li
              class="text-foreground bg-muted hover:bg-muted/60 relative z-10 whitespace-nowrap rounded-full px-3 py-1.5 font-medium"
            >
              <Chip shape="rounded-2xl" size="lg" value="Free plan" />
            </li>
            <li
              class="text-foreground bg-muted hover:bg-muted/60 relative z-10 whitespace-nowrap rounded-full px-3 py-1.5 font-medium"
            >
              Launch
            </li>
            <li
              class="text-foreground bg-muted hover:bg-muted/60 relative z-10 whitespace-nowrap rounded-full px-3 py-1.5 font-medium"
            >
              Roadmap
            </li>
          </ul>
        </div>
        <div class="group relative">
          <h3
            class="text-foreground group-hover:text-foreground/60 mt-3 text-lg font-semibold leading-6"
          >
            <a href="/blog/live-roadmap-singleplayer"
              ><span class="absolute inset-0"></span>The 🔴 LIVE Roadmap</a
            >
          </h3>
          <p class="text-foreground/60 mt-5 line-clamp-3 text-sm leading-6">
            It's the Launch Week Day finale, Day 5! We are going out with a bang and introducing the
            🔴 LIVE roadmap, featuring our next Product Hunt Launch - Free Singleplayer Documenso -
            Sign without creating an account!
          </p>
        </div>
        <div class="relative mt-4 flex items-center gap-x-4">
          <div class="bg-foreground/5 h-10 w-10 rounded-full">
            <img
              src="/blog/rotimi-best-avatar.jpeg"
              alt="Avatar of Rotimi Best"
              class="bg-foreground/5 h-10 w-12 rounded-full"
            />
          </div>
          <div class="text-sm leading-6">
            <p class="text-foreground font-semibold">Rotimi Best</p>
            <p class="text-foreground/60">Founder</p>
          </div>
        </div>
      </article>
    </div>
  </div>
</div>
